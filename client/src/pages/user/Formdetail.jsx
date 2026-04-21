import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, ArrowLeft, Save, Heart, Baby,
    User, Calendar, ShieldCheck, Home, TrendingUp, Users, Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const Formdetail = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // ✅ State ครบ 13 ข้อตามบรีฟเป๊ะๆ
    const [formData, setFormData] = useState({
        gender: 'male',                 // 1. เพศ
        age: '',                        // 2. อายุ
        status: 'single',               // 3. สถานะ
        spouseHasIncome: 'no',          // 3.1 คู่สมรสมีรายได้ไหม
        childStatus: 'none',            // 3.2 สถานะบุตร (ฝากครรภ์/คลอดแล้ว)
        numChildren: 0,                 // 3.3 จำนวนบุตร
        numChildType1: 0, // ลูกคนแรก หรือเกิดก่อนปี 61 (คนละ 3 หมื่น)
        numChildType2: 0, // ลูกคนที่ 2 ขึ้นไป และเกิดปี 61 เป็นต้นไป (คนละ 6 หมื่น)
        hasFixedIncome: 'yes',          // 4. รายได้ประจำ
        parentsCare: 'none',            // 5. เลี้ยงดูบิดามารดา (บิดา/มารดา/ทั้งคู่)
        isDisabledCare: 'no',           // 6. ดูแลผู้พิการ
        socialSecurityType: 'm33',      // 7. ประกันสังคม มาตรา
        ssAmount: 750,                  // 7.1 จำนวนเงินประกันสังคม
        lifeInsurance: '',              // 8. เบี้ยประกันชีวิต/สะสมทรัพย์
        healthInsurance: '',            // 9. ประกันสุขภาพตนเอง
        parentsHealthInsurance: '',     // 10. ประกันสุขภาพบิดามารดา
        rmf: '',                        // 11.1 RMF
        ssf: '',                        // 11.2 SSF
        thaiEsg: '',                    // 11.3 Thai ESG
        pensionInsurance: '',           // 12. ประกันบำนาญ
        homeLoanInterest: ''            // 13. ดอกเบี้ยบ้าน
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            const resMaster = await api.get('/fund-types');
            const funds = resMaster.data;

            // ฟังก์ชันช่วยหา ID จาก CODE (Case-Sensitive ตาม Admin)
            const getFundId = (code) => funds.find(f => f.code === code)?.id;

            const investments = [];
            const addInv = (code, val) => {
                const id = getFundId(code);
                if (id) {
                    investments.push({
                        fundTypeId: id,
                        amount: Number(val || 0)
                    });
                }
            };

            // --- 1. ส่วนตัวและครอบครัว ---
            addInv('PERSONAL', 1); // ใน Admin ติ๊ก 'คน' และ 'ล็อค' ไว้

            if (formData.status === 'married' && formData.spouseHasIncome === 'no') {
                addInv('SPOUSE', 1); // ส่ง 1 คน
            }

            // 👶 ลูก: ส่งเป็น "จำนวนคน" (เพราะ Admin ติ๊ก isCount)
            if (formData.numChildType1 > 0) addInv('CHILD_BIO_1', formData.numChildType1);
            if (formData.numChildType2 > 0) addInv('CHILD_BIO_261', formData.numChildType2);
            if (formData.childStatus === 'pregnant') addInv('MATERNITY', 1); // ถ้าติ๊กฝากครรภ์

            // 👴 พ่อแม่: ส่งเป็น "จำนวนคน" (ใช้ Code ตาม Admin)
            if (formData.parentsCare === 'father' || formData.parentsCare === 'mother') addInv('PARENT_SELF', 1);
            if (formData.parentsCare === 'both') addInv('PARENT_SELF', 2);

            // ดูแลผู้พิการ
            if (formData.isDisabledCare === 'yes') addInv('DISABLED_CARE', 1);

            // --- 2. ประกัน (ใช้ Code ย่อตาม Admin) ---
            addInv('SOCIAL_SEC', formData.ssAmount * 12);
            addInv('LIFE_INS', formData.lifeInsurance);
            addInv('HEALTH_INS', formData.healthInsurance);
            addInv('PARENT_HEALTH', formData.parentsHealthInsurance);
            addInv('PENSION_INS', formData.pensionInsurance);

            // --- 3. การลงทุนและกองทุน ---
            addInv('RMF', formData.rmf);
            addInv('SSF', formData.ssf);
            addInv('THAI_ESG', formData.thaiEsg);
            addInv('HOME_LOAN_INT', formData.homeLoanInterest);

            // ✅ ส่งข้อมูลไป Backend
            await api.post('/deduction', { ...formData, investments });

            toast.success("บันทึกข้อมูลเรียบร้อย!");
            navigate('/user/deductionuser');
        } catch (err) {
            console.error(err);
            toast.error("บันทึกไม่สำเร็จ ตรวจสอบ Code ในหน้า Admin ให้ตรงกับที่โปรแกรมเรียก");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
            <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12">

                <div className="flex gap-2 mb-10">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                    ))}
                </div>

                {/* STEP 1: ตัวตนและรายได้ (1, 2, 4) */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-5">
                        <h2 className="text-2xl font-black flex items-center gap-3"><User className="text-indigo-600" /> ข้อมูลส่วนตัว</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setFormData({ ...formData, gender: 'male' })} className={`p-4 rounded-2xl font-bold border ${formData.gender === 'male' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>ชาย</button>
                            <button onClick={() => setFormData({ ...formData, gender: 'female' })} className={`p-4 rounded-2xl font-bold border ${formData.gender === 'female' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>หญิง</button>
                        </div>
                        <input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border focus:border-indigo-400" placeholder="อายุของคุณ (ปี)" />
                        <div className="p-5 bg-slate-50 rounded-2xl">
                            <p className="text-sm font-bold mb-3">ปัจจุบันคุณมีรายได้ประจำไหม?</p>
                            <div className="flex gap-2">
                                {['yes', 'no'].map(opt => <button key={opt} onClick={() => setFormData({ ...formData, hasFixedIncome: opt })} className={`flex-1 py-2 rounded-xl font-bold ${formData.hasFixedIncome === opt ? 'bg-white shadow-sm border' : 'text-slate-400'}`}>{opt === 'yes' ? 'มี' : 'ไม่มี'}</button>)}
                            </div>
                        </div>
                        <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">ต่อไป</button>
                    </div>
                )}

                {/* STEP 2: ครอบครัวและภาระ (3, 5, 6) */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-5">
                        <h2 className="text-2xl font-black flex items-center gap-3"><Heart className="text-rose-500" /> ครอบครัวและภาระ</h2>
                        <div className="grid grid-cols-3 gap-2">
                            {['single', 'married', 'divorced'].map(s => <button key={s} onClick={() => setFormData({ ...formData, status: s })} className={`py-3 rounded-xl font-bold text-sm border ${formData.status === s ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-400'}`}>{s === 'single' ? 'โสด' : s === 'married' ? 'สมรส' : 'หย่า'}</button>)}
                        </div>

                        {formData.status === 'married' && (
                            <div className="p-4 bg-rose-50 rounded-2xl flex justify-between items-center">
                                <span className="text-sm font-bold">คู่สมรสมีรายได้ไหม?</span>
                                <div className="flex gap-2">
                                    {['yes', 'no'].map(opt => <button key={opt} onClick={() => setFormData({ ...formData, spouseHasIncome: opt })} className={`px-4 py-1 rounded-lg text-xs font-bold ${formData.spouseHasIncome === opt ? 'bg-rose-500 text-white' : 'bg-white'}`}>{opt === 'yes' ? 'มี' : 'ไม่มี'}</button>)}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <p className="text-sm font-bold ml-1">ข้อมูลบุตร</p>
                            <div className="grid grid-cols-3 gap-2">
                                {['none', 'pregnant', 'born'].map(opt => <button key={opt} onClick={() => setFormData({ ...formData, childStatus: opt })} className={`py-3 rounded-xl font-bold text-xs ${formData.childStatus === opt ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400'}`}>{opt === 'none' ? 'ไม่มี' : opt === 'pregnant' ? 'ฝากครรภ์' : 'คลอดแล้ว'}</button>)}
                            </div>
                            {formData.childStatus === 'born' && <input type="number" value={formData.numChildren} onChange={(e) => setFormData({ ...formData, numChildren: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border" placeholder="จำนวนกี่คน?" />}
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-bold ml-1">เลี้ยงดูบิดามารดา (60 ปีขึ้นไป)</p>
                            <div className="grid grid-cols-2 gap-2">
                                {['none', 'father', 'mother', 'both'].map(opt => <button key={opt} onClick={() => setFormData({ ...formData, parentsCare: opt })} className={`py-3 rounded-xl font-bold text-xs ${formData.parentsCare === opt ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>{opt === 'none' ? 'ไม่ได้ดูแล' : opt === 'father' ? 'บิดา' : opt === 'mother' ? 'มารดา' : 'ทั้งสองท่าน'}</button>)}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                            <span className="text-sm font-bold">คุณเป็นผู้ดูแลผู้พิการหรือไม่?</span>
                            <button onClick={() => setFormData({ ...formData, isDisabledCare: formData.isDisabledCare === 'yes' ? 'no' : 'yes' })} className={`px-6 py-2 rounded-xl font-bold ${formData.isDisabledCare === 'yes' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-400'}`}>{formData.isDisabledCare === 'yes' ? 'ใช่' : 'ไม่ใช่'}</button>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="p-4 bg-slate-100 rounded-2xl"><ArrowLeft /></button>
                            <button onClick={() => setStep(3)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold">ต่อไป</button>
                        </div>
                    </div>
                )}

                {/* STEP 3: ประกันและสวัสดิการ (7, 8, 9, 10, 12) */}
                {step === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-5">
                        <h2 className="text-2xl font-black flex items-center gap-3"><ShieldCheck className="text-emerald-500" /> ประกันและสวัสดิการ</h2>
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase">ประกันสังคม</p>
                            <div className="grid grid-cols-4 gap-2">
                                {['m33', 'm39', 'm40', 'none'].map(m => <button key={m} onClick={() => setFormData({ ...formData, socialSecurityType: m })} className={`py-2 rounded-xl font-bold text-xs ${formData.socialSecurityType === m ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>{m.toUpperCase()}</button>)}
                            </div>
                            {formData.socialSecurityType !== 'none' && <input type="number" value={formData.ssAmount} onChange={(e) => setFormData({ ...formData, ssAmount: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border font-bold text-emerald-600" placeholder="จ่ายเดือนละกี่บาท?" />}
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <InputField label="เบี้ยประกันชีวิต/สะสมทรัพย์ (ทั้งปี)" value={formData.lifeInsurance} onChange={(e) => setFormData({ ...formData, lifeInsurance: e.target.value })} />
                            <InputField label="ประกันสุขภาพตนเอง (ทั้งปี)" value={formData.healthInsurance} onChange={(e) => setFormData({ ...formData, healthInsurance: e.target.value })} />
                            <InputField label="ประกันสุขภาพบิดามารดา (ทั้งปี)" value={formData.parentsHealthInsurance} onChange={(e) => setFormData({ ...formData, parentsHealthInsurance: e.target.value })} />
                            <InputField label="เบี้ยประกันชีวิตแบบบำนาญ (ทั้งปี)" value={formData.pensionInsurance} onChange={(e) => setFormData({ ...formData, pensionInsurance: e.target.value })} />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(2)} className="p-4 bg-slate-100 rounded-2xl"><ArrowLeft /></button>
                            <button onClick={() => setStep(4)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold">ต่อไป</button>
                        </div>
                    </div>
                )}

                {/* STEP 4: การลงทุนและที่อยู่อาศัย (11, 13) */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-5">
                        <h2 className="text-2xl font-black flex items-center gap-3"><TrendingUp className="text-amber-500" /> การลงทุนและบ้าน</h2>
                        <div className="grid grid-cols-1 gap-4 p-5 bg-slate-50 rounded-[2rem]">
                            <p className="text-sm font-bold text-slate-500 uppercase">ยอดซื้อกองทุนปีนี้</p>
                            <InputField label="RMF" value={formData.rmf} onChange={(e) => setFormData({ ...formData, rmf: e.target.value })} />
                            <InputField label="SSF" value={formData.ssf} onChange={(e) => setFormData({ ...formData, ssf: e.target.value })} />
                            <InputField label="Thai ESG" value={formData.thaiEsg} onChange={(e) => setFormData({ ...formData, thaiEsg: e.target.value })} />
                        </div>
                        <div className="p-5 border-2 border-amber-100 rounded-[2rem]">
                            <InputField label="ดอกเบี้ยกู้ยืมที่อยู่อาศัย (ทั้งปี)" value={formData.homeLoanInterest} onChange={(e) => setFormData({ ...formData, homeLoanInterest: e.target.value })} />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(3)} className="p-4 bg-slate-100 rounded-2xl"><ArrowLeft /></button>
                            <button onClick={handleSave} disabled={loading} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3">
                                {loading ? 'กำลังบันทึก...' : <><Save size={24} /> บันทึกทั้งหมด</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const InputField = ({ label, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{label}</label>
        <input type="number" value={value} onChange={onChange} className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-indigo-400" placeholder="0" />
    </div>
);

export default Formdetail;