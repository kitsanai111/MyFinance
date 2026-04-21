import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, User, ArrowRight, FileText, CheckCircle, Calculator, PieChart, TrendingUp, Edit2, CalendarRange, Info } from 'lucide-react';

// ✅ Import ของจริง
import useEcomStore from '../../store/ecom-store';
import api from '../../utils/api';

const TaxPage = () => {
    const navigate = useNavigate();
    const token = useEcomStore((state) => state.token);
    const [loading, setLoading] = useState(true);
    const currentYear = new Date().getFullYear();
    const [taxData, setTaxData] = useState({
        totalIncome: 0,
        totalDeduction: 0,
        netIncome: 0,
        tax: 0,
        profile: null
    });
    const hasAnyInvestment = taxData.investments?.some(inv => inv.rawAmount > 0);

    // ✅ 1. ดึงข้อมูลสรุปภาษีจาก Backend (/api/deduction/summary)
    useEffect(() => {
        const fetchTaxSummary = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // เรียกใช้ Endpoint ที่เราแก้ Backend ให้ส่งค่า Summary มาให้ครบ
                const res = await api.get('/deduction');

                if (res.data && res.data.profile) {
                    setTaxData(res.data);
                } else {
                    setTaxData(prev => ({ ...prev, profile: null }));
                }
            } catch (err) {
                console.error("Error fetching tax summary:", err);
                setTaxData(prev => ({ ...prev, profile: null }));
            } finally {
                setLoading(false);
            }
        };

        fetchTaxSummary();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-sans">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="animate-pulse font-medium">กำลังประมวลผลข้อมูลภาษี...</span>
            </div>
        );
    }
    // 🔴 LOGIC: ถ้าไม่เคยกรอกข้อมูลลดหย่อนเลย
    if (!taxData.profile) {
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
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3 text-slate-900">
                            สรุปการคำนวณภาษี
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                            <CalendarRange size={14} /> ข้อมูลประจำปี {currentYear}
                        </p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2 text-sm font-bold shadow-sm">
                        <CheckCircle size={16} /> ข้อมูลอัปเดตแล้ว
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: รายได้พึงประเมิน */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp size={24} className="text-blue-500" /> รายได้และค่าใช้จ่าย
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {/* ยอดรายได้รวม */}
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-slate-500 text-sm font-medium">รายได้สะสมทั้งปี (พึงประเมิน)</span>
                                    <div className="text-3xl font-black text-slate-900 mt-1">
                                        ฿{Number(taxData.totalIncome || 0).toLocaleString()}
                                    </div>
                                </div>

                                {/* รายละเอียดการหัก */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="p-4 border border-slate-100 rounded-xl">
                                        <span className="text-slate-400">หักค่าใช้จ่ายเหมา (50%) แต่ไม่เกิน 100,000 บาท</span>
                                        <div className="font-bold text-slate-700 mt-1">- ฿{Math.min(taxData.totalIncome * 0.5, 100000).toLocaleString()}</div>
                                    </div>

                                    <div className="p-4 border border-slate-100 rounded-xl">
                                        <span className="text-slate-400">เงินได้สุทธิหลังหักลดหย่อน</span>
                                        <div className="font-bold text-blue-600 mt-1">฿{Number(taxData.netIncome || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="p-5 border border-slate-100 rounded-xl">
                                    <p className="text-[14px] text-slate-400 italic ">
                                        หมายเหตุ: การคำนวณนี้เป็นประมาณการเบื้องต้นตามอัตราภาษีบุคคลธรรมดา
                                        สำหรับยื่นภาษีเงินได้พึงประเมินประเภทที่ 1 (เงินเดือน) เท่านั้น
                                    </p>
                                </div>

                                <div className="mt-12 space-y-6">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <AlertCircle className="text-blue-500" /> คำแนะนำเพื่อประหยัดภาษีเพิ่ม
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* 🔴 กรณี: ยังไม่เคยกรอกอะไรเลย */}
                                        {!hasAnyInvestment && (
                                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
                                                <h4 className="font-bold text-blue-900 mb-2">
                                                    คุณยังไม่ได้ใช้สิทธิ์ลดหย่อน
                                                </h4>
                                                <p className="text-sm text-blue-700">
                                                    คุณสามารถใช้สิทธิ์ลดหย่อนภาษีผ่านกองทุน เช่น RMF, SSF
                                                    หรือประกันชีวิต ได้ตามที่กฎหมายกำหนด
                                                </p>
                                            </div>
                                        )}

                                        {/* 🟢 กรณี: เคยกรอกแล้ว */}
                                        {hasAnyInvestment &&
                                            taxData.investments
                                                ?.filter(inv => inv.rawAmount === 0 && inv.fundType.category === 'discountfund')
                                                .map(inv => (
                                                    <div key={inv.fundTypeId} className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
                                                        <h4 className="font-bold text-blue-900 mb-1">
                                                            {inv.fundType.name}
                                                        </h4>
                                                        <p className="text-sm text-blue-700">
                                                            คุณยังสามารถใช้สิทธิ์ลดหย่อนหมวดนี้ได้ตามกฎหมาย
                                                        </p>
                                                    </div>
                                                ))
                                        }
                                    </div>
                                    <div className="mt-6 flex flex-col gap-3">
                                        <button
                                            onClick={() => window.open('https://www.finnomena.com', '_blank', 'noopener,noreferrer')}
                                            className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-white text-slate-600 border border-slate-200 px-4 py-3 rounded-full shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all" >
                                            แนะนำการลงทุน (finnomena)
                                        </button>

                                        <button
                                            onClick={() => window.open('https://www.finnomena.com/finnomenafunds/tax-deduction-guide/', '_blank', 'noopener,noreferrer')}
                                            className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-white text-slate-600 border border-slate-200 px-4 py-3 rounded-full shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all" >
                                            รายละเอียดค่าลดหย่อนภาษี (finnomena)
                                        </button>
                                    </div>
                                </div>

                                <p className="text-[10px] text-slate-400 italic mt-4">* การคำนวณนี้เป็นการประมาณการเบื้องต้นตามโครงสร้างภาษีเงินได้บุคคลธรรมดา</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: สรุปค่าลดหย่อน & ยอดภาษี */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Summary Deductions */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 text-slate-50 opacity-10 transform rotate-12">
                                <PieChart size={180} />
                            </div>

                            <h2 className="text-lg font-bold mb-6 text-slate-800 border-b border-slate-50 pb-4 relative z-10">
                                รายการลดหย่อน
                            </h2>
                            <ul className="space-y-4 text-sm relative z-10">
                                {/* วนลูปแสดงผลแยกตามหมวดหมู่ที่ Admin ตั้งไว้ */}
                                {['family', 'insurance', 'investment', 'discountfund'].map(catGroup => {
                                    // รวมยอดเงินในหมวดหมู่นั้นๆ
                                    const groupTotal = taxData.investments
                                        ?.filter(inv => inv.fundType.category === catGroup)
                                        .reduce((sum, item) => sum + Number(item.finalAmount || 0), 0)

                                    // ชื่อหมวดหมู่ภาษาไทย
                                    const catNames = {
                                        family: 'ส่วนตัวและครอบครัว',
                                        insurance: 'ประกันและเงินออม',
                                        investment: 'การลงทุน',
                                        discountfund: 'กองทุนลดหย่อน'
                                    };

                                    if (groupTotal === 0) return null; // ถ้าหมวดไหนไม่มีข้อมูล ไม่ต้องโชว์

                                    return (
                                        <li key={catGroup} className="flex justify-between items-center group">
                                            <span className="text-slate-500">{catNames[catGroup]}</span>
                                            <span className="font-bold text-slate-700">
                                                ฿{groupTotal.toLocaleString()}
                                            </span>
                                        </li>
                                    );
                                })}

                                <li className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="font-bold text-slate-800">รวมลดหย่อนทั้งสิ้น</span>
                                    <span className="text-xl font-black text-emerald-600">
                                        ฿{Number(taxData.totalDeduction || 0).toLocaleString()}
                                    </span>
                                </li>
                            </ul>

                            <button
                                onClick={() => navigate('/user/deductionuser')}
                                className="mt-8 w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl text-sm transition-all border border-slate-200 flex items-center justify-center gap-2"
                            >
                                <Edit2 size={16} /> แก้ไขข้อมูลลดหย่อน
                            </button>
                        </div>

                        {/* FINAL TAX RESULT */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl shadow-slate-200">
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">ภาษีที่ต้องชำระปีนี้</h3>
                            <div className="text-4xl font-black text-yellow-400 flex items-baseline gap-2">
                                {Number(taxData.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <span className="text-sm font-medium text-slate-400">THB</span>
                            </div>
                            <div className="mt-6 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    คำนวณตามอัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได 0% - 35% ประจำปีภาษี 2568
                                </p>
                            </div>
                        </div>



                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxPage;