import React, { useState, useEffect, useMemo } from 'react';
import { User, Shield, Briefcase, Save, Edit2, AlertCircle, CheckSquare, Square, Info, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useEcomStore from '../../store/ecom-store';
import api from '../../utils/api';
import Swal from 'sweetalert2';

const DeductionUser = () => {
    const navigate = useNavigate();
    const user = useEcomStore((state) => state.user);
    const token = useEcomStore((state) => state.token);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [deductions, setDeductions] = useState({});
    const [enabledDeductions, setEnabledDeductions] = useState({ personal: true });
    const [masterFunds, setMasterFunds] = useState([]);
    const [formCompleted, setFormCompleted] = useState(false);

    // ✅ 1. โหลดข้อมูลและจัดการหน่วย (คน/บาท)
    const fetchDeductions = async () => {
        try {
            const res = await api.get('/deduction');
            if (!res.data?.profile) {
                setFormCompleted(false);
                return;
            } setFormCompleted(true);
            if (res.data && res.data.investments) {
                const serverInvestments = res.data.investments;
                setMasterFunds(serverInvestments);

                const initialValues = {};
                const initialEnabled = {};

                serverInvestments.forEach(inv => {
                    const code = inv.fundType.code;
                    // 💡 ใช้ค่าดิบจากหลังบ้าน (ที่เราแก้เป็น rawAmount) มาลงช่อง Input
                    initialValues[code] = inv.rawAmount;
                    if (inv.rawAmount > 0) initialEnabled[code] = true;
                });

                setDeductions(initialValues);
                setEnabledDeductions(initialEnabled);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchDeductions(); }, [token]);

    // ✅ 2. Logic คำนวณยอดรวม (คำนวณเงินจริงจากจำนวนคน)
    const totals = useMemo(() => {
        let normalTotal = 0;
        let retirementSum = 0;
        let insuranceSum = 0;

        masterFunds.forEach(f => {
            const code = f.fundType.code;
            if (enabledDeductions[code]) {
                let amount = 0;

                if (f.fundType.isCount) {

                    amount = Number(deductions[code] || 0) * Number(f.fundType.taxLimit);
                } else {
                    amount = f.fundType.isFixed
                        ? Number(f.fundType.taxLimit)
                        : Number(deductions[code] || 0);
                }

                if (f.fundType.isRetirement) {
                    retirementSum += amount;

                } else if (f.fundType.insuranceGroup === 'INSURANCE_100K') {
                    insuranceSum += amount;

                } else {
                    normalTotal += amount;
                }
            }
        });

        const cappedRetirement = Math.min(retirementSum, 500000);
        const cappedInsurance = Math.min(insuranceSum, 100000);
        return {
            total: normalTotal + cappedRetirement + cappedInsurance,
            retirementSum,
            insuranceSum,
            isRetirementOver: retirementSum > 500000,
            isInsuranceOver: insuranceSum > 100000
        };

    }, [deductions, enabledDeductions, masterFunds]);

    const overAmount = totals.retirementSum - 500000;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDeductions(prev => ({ ...prev, [name]: Math.max(0, Number(value)) }));
    };

    const handleToggle = (name) => {
        if (!isEditing) return;
        setEnabledDeductions(prev => {
            const newState = !prev[name];
            if (!newState) setDeductions(d => ({ ...d, [name]: 0 }));
            return { ...prev, [name]: newState };
        });
    };

    // ✅ 3. บันทึกข้อมูล (คูณจำนวนคนกลับเป็นเงินก่อนเซฟ)
    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                investments: masterFunds.map(f => {
                    const code = f.fundType.code;
                    // 💡 ส่งค่าที่ User พิมพ์ในช่อง Input ไปเลย ไม่ต้องคูณอะไรทั้งสิ้น!
                    const inputVal = Number(deductions[code] || 0);

                    const sendValue = (f.fundType.isFixed && !f.fundType.isCount) ? 1 : inputVal;
                    return { fundTypeId: f.fundType.id, amount: sendValue };
                }).filter(item => enabledDeductions[masterFunds.find(mf => mf.fundType.id === item.fundTypeId).fundType.code])
            };

            await api.post('/deduction', payload);
            toast.success("บันทึกสำเร็จ");
            setIsEditing(false);
            fetchDeductions(); // โหลดข้อมูลใหม่จาก DB มาเช็คความชัวร์
        } catch (err) {
            console.error(err);
            toast.error("บันทึกไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };
    // ✅ เพิ่มฟังก์ชันจัดการการพิมพ์ค่า
    const handleValueChange = (e) => {
        const { name, value } = e.target;
        let val = Number(value);

        // 💡 บังคับ Logic คู่สมรส: ถ้าเป็น SPOUSE ให้กรอกได้แค่ 0 หรือ 1
        if (name === 'SPOUSE') {
            val = val > 1 ? 1 : (val < 0 ? 0 : val);
        } else {
            val = Math.max(0, val); // รายการอื่นห้ามติดลบ
        }

        setDeductions(prev => ({ ...prev, [name]: val }));
    };


    // ✅ เพิ่มเงื่อนไขเช็ค CODE พิเศษใน ProfileUser.jsx
    const renderSectionItems = (categoryName) => {
        return masterFunds
            .filter(f => f.fundType.category === categoryName)
            .map(f => {
                const { isFixed, isCount, taxLimit, code, name } = f.fundType;
                const isEnabled = enabledDeductions[code];

                // 💡 1. ย้าย Logic คำนวณ displayValue มาไว้ในนี้
                let displayValue = 0;
                if (isEnabled) {
                    // รายการที่ "ล็อค" (PERSONAL / SPOUSE) ให้โชว์ยอดเงินเต็มเสมอ
                    if (isFixed && !isCount) {
                        displayValue = Number(taxLimit);
                    } else {
                        // รายการอื่น (ลูก / ประกัน) ให้โชว์ค่าจาก State (เช่น 1 คน หรือ ยอดเงินประกัน)
                        displayValue = deductions[code] || 0;
                    }
                }

                return (
                    <InputGroup
                        key={code}
                        label={name}
                        name={code}
                        value={displayValue}
                        isEnabled={isEnabled}
                        onToggle={() => {
                            handleToggle(code);
                            // 🚩 เมื่อติ๊กถูก ให้เซ็ตค่าเริ่มต้นเข้าไป
                            if (!isEnabled) {
                                setDeductions(prev => ({
                                    ...prev,
                                    [code]: isCount ? 1 : Number(taxLimit)
                                }));
                            }
                        }}
                        onChange={handleValueChange}
                        // ล็อคช่องถ้า Admin สั่ง Fixed (แต่ยอมให้แก้ถ้าเป็นจำนวนคน เช่น ลูก)
                        disabled={!isEditing || (isFixed && !isCount)}
                        unit={(isCount && code !== 'SPOUSE' && code !== 'PERSONAL') ? "คน" : "THB"}
                        hint={code === 'SPOUSE' ? "สิทธิ์ลดหย่อน 60,000 บาท" : null}
                    />
                );
            });
    };
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-sans">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="animate-pulse font-medium">กำลังประมวลผลข้อมูลค่าลดหย่อน...</span>
            </div>
        );
    }
    // วางไว้หลัง loading check / masterFunds check
    if (!formCompleted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-100">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={40} className="text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">ยังไม่ได้ตอบแบบสอบถาม</h2>
                    <p className="text-slate-500 mb-8 text-sm">กรุณาตอบแบบสอบถามก่อนเพื่อเริ่มใช้งาน</p>
                    <button
                        onClick={() => navigate('/user/tax')}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-100"
                    >
                        <User size={20} /> ไปตอบแบบสอบถาม <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }
    if (masterFunds.length === 0 && !loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-100">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={40} className="text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">ไม่พบข้อมูลลดหย่อน</h2>
                    <p className="text-slate-500 mb-8 text-sm">กรุณาตั้งค่าข้อมูลลดหย่อนส่วนตัวก่อนเพื่อเริ่มคำนวณภาษี</p>
                    <button
                        onClick={() => navigate('/user/formdetail')}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-100"
                    >
                        <User size={20} /> ไปตั้งค่าโปรไฟล์ภาษี <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        ข้อมูลค่าลดหย่อน
                    </h1>
                    <button onClick={() => {
                        if (isEditing) {
                            Swal.fire({
                                title: 'บันทึกข้อมูล?',
                                text: 'ยืนยันการบันทึกข้อมูลค่าลดหย่อน',
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonColor: '#F59E0B',
                                cancelButtonColor: '#9CA3AF',
                                confirmButtonText: 'บันทึก',
                                cancelButtonText: 'ยกเลิก',
                                reverseButtons: true,
                            }).then((result) => {
                                if (result.isConfirmed) handleSave();
                            });
                        } else {
                            setIsEditing(true);
                        }
                    }}
                        className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-md ${isEditing ? 'bg-emerald-500 text-white' : 'bg-white'}`}>
                        {isEditing ? 'บันทึกข้อมูล' : 'แก้ไขข้อมูล'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
                            <p className="text-slate-400 text-[10px] font-black uppercase">ลดหย่อนรวม</p>
                            <h2 className="text-4xl font-black text-yellow-400">฿{totals.total.toLocaleString()}</h2>
                        </div>
                        {totals.isRetirementOver && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-700 flex gap-2">
                                <AlertCircle size={20} />
                                <span className="text-xs font-bold">
                                    เกิน {overAmount.toLocaleString()} บาท (ใช้ได้สูงสุด 500,000)
                                </span>
                            </div>
                        )}
                        {totals.isInsuranceOver && (
                            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl text-orange-700 flex gap-2">
                                <AlertCircle size={20} />
                                <span className="text-xs font-bold">
                                    ประกันเกิน {(totals.insuranceSum - 100000).toLocaleString()} บาท (ใช้ได้สูงสุด 100,000)
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        <Section title="ส่วนตัวและครอบครัว" icon={<User className="text-blue-500" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderSectionItems('family')}
                            </div>
                        </Section>

                        <Section title="ประกันและเงินออม" icon={<Shield className="text-emerald-500" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderSectionItems('insurance')}
                            </div>
                        </Section>

                        <Section title="กองทุนลดหย่อน" icon={<Briefcase className="text-purple-500" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderSectionItems('discountfund')}
                            </div>
                        </Section>

                        <Section title="การลงทุน" icon={<Briefcase className="text-purple-500" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderSectionItems('investment')}
                            </div>
                        </Section>


                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---
const Section = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-50">
            {icon} <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wide">{title}</h3>
        </div>
        {children}
    </div>
);

const InputGroup = ({ label, name, value, onChange, disabled, hint, isEnabled, onToggle, unit = "THB" }) => (
    <div className={`${!isEnabled ? 'opacity-30' : 'opacity-100'} transition-all`}>
        <div className="flex items-center gap-2 mb-1.5 cursor-pointer" onClick={onToggle}>
            {isEnabled ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} className="text-slate-300" />}
            <label className="text-[10px] font-black uppercase text-slate-500">{label}</label>
        </div>
        {isEnabled && (
            <div className="relative">
                <input type="number" name={name} value={value} onChange={onChange} disabled={disabled}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl font-bold text-slate-700 disabled:bg-slate-100" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">
                    {unit}
                </span>
                {hint && <p className="text-[9px] text-slate-400 mt-1 font-bold italic">* {hint}</p>}
            </div>
        )}
    </div>
);

export default DeductionUser;