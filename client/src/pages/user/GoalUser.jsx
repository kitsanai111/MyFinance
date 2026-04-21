import React, { useState, useEffect } from 'react';
import { Save, Calculator, AlertTriangle, Target, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useEcomStore from '../../store/ecom-store'; 
import api from '../../utils/api';

const GoalUser = () => {
    const token = useEcomStore((s) => s.token);
    const navigate = useNavigate();
    
    const [salary, setSalary] = useState('');          
    const [totalGoal, setTotalGoal] = useState('');   
    const [monthlySavings, setMonthlySavings] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [fundMaster, setFundMaster] = useState([]); // เก็บข้อมูล % สิทธิ์และกำไรจาก Admin

    const [result, setResult] = useState({
        monthlyLimit: 0, dailyLimit: 0, 
        yearsToGoal: 0, monthsToGoal: 0,
        investYears: 0, investMonths: 0, // ผลลัพธ์แบบทบต้น
        timeSaved: 0
    });

    useEffect(() => {
        if (!token) { navigate('/'); return; }
        fetchData();
    }, [token]);

    useEffect(() => {
        calculatePlan();
    }, [salary, totalGoal, monthlySavings, fundMaster]);

    const fetchData = async () => {
        try {
            // 1. ดึงเป้าหมายเดิม
            const resGoal = await api.get('/goal');
            if (resGoal.data) {
                setSalary(resGoal.data.salary?.toString() || '');
                setMonthlySavings(resGoal.data.savingsTarget?.toString() || '');
                setTotalGoal(resGoal.data.totalGoal?.toString() || '');
            }

            // 2. ดึง Master Data กองทุนมาเพื่อเอา % กำไรเฉลี่ย และ % สิทธิ์เงินได้
            const resMaster = await api.get('/fund-types');
            setFundMaster(resMaster.data);
        } catch(err) { console.log(err); }
    };

    const calculatePlan = () => {
        const inc = Number(salary) || 0;
        const savePerMonth = Number(monthlySavings) || 0;
        const target = Number(totalGoal) || 0;

        // คำนวณงบใช้จ่าย
        let limit = inc - savePerMonth;
        if (limit < 0) limit = 0; 

        // คำนวณแบบเก็บเงินสดปกติ
        let totalMonthsNormal = (savePerMonth > 0 && target > 0) ? Math.ceil(target / savePerMonth) : 0;

        setResult({
            monthlyLimit: limit,
            dailyLimit: limit / 30,
            yearsToGoal: Math.floor(totalMonthsNormal / 12),
            monthsToGoal: totalMonthsNormal % 12
        });
    };

    const handleSaveGoal = async () => {
        if (!salary || !monthlySavings || !totalGoal) return toast.warning("กรุณากรอกข้อมูลให้ครบ");
        
        // ⚠️ เช็คสิทธิ์ % เงินได้ (สมมติใช้เกณฑ์สูงสุด 30% ตามมาตรฐานกองทุนลดหย่อน)
        const maxAllowedSaving = Number(salary) * 0.30;
        if (Number(monthlySavings) > maxAllowedSaving) {
            toast.info(`คุณออมเกิน 30% ของเงินเดือน (${maxAllowedSaving.toLocaleString()} บาท) อาจใช้สิทธิ์ลดหย่อนภาษีได้ไม่เต็มจำนวน`);
        }

        setLoading(true);
        try {
            await api.post('/goal', {
                salary: Number(salary),
                savingsTarget: Number(monthlySavings), 
                totalGoal: Number(totalGoal),
                isPercentage: false 
            });
            toast.success("บันทึกแผนและอัปเดตระบบแจ้งเตือนแล้ว!");
        } catch (err) { toast.error("บันทึกไม่สำเร็จ"); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        เป้าหมายเงินเก็บ {Number(totalGoal).toLocaleString()}.-
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* ฝั่งกรอกข้อมูล */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-700">
                                <Calculator size={20} className="text-yellow-500"/> ตั้งค่าแผนการเงิน
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">รายรับต่อเดือน</label>
                                    <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xl outline-none focus:ring-2 ring-yellow-400 transition-all" placeholder="0" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">เป้าหมายเงินก้อน</label>
                                    <input type="number" value={totalGoal} onChange={(e) => setTotalGoal(e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xl outline-none focus:ring-2 ring-yellow-400 transition-all" placeholder="0" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">เงินออมต่อเดือน</label>
                                    <input type="number" value={monthlySavings} onChange={(e) => setMonthlySavings(e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xl outline-none focus:ring-2 ring-yellow-400 transition-all" placeholder="0" />
                                </div>
                            </div>
                            <button onClick={handleSaveGoal} disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                                <Save size={20}/> บันทึกเป้าหมาย
                            </button>
                        </div>
                    </div>

                    {/* ฝั่งแสดงผลลัพธ์ */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* เปรียบเทียบความเร็ว */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-yellow-100 relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl"></div>
                            <h3 className="text-slate-400 font-black text-xs uppercase tracking-widest mb-6">ระยะเวลาที่จะถึงเป้าหมาย</h3>
                            
                            <div className="space-y-1 p-4 bg-emerald-50 rounded-3xl border border-emerald-100 relative">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">ออมเงินสดปกติ</p>
                                    <div className="text-4xl font-black text-emerald-700">
                                        {result.yearsToGoal} <span className="text-lg">ปี</span> {result.monthsToGoal} <span className="text-lg">เดือน</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* งบรายวัน */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">งบใช้จ่าย/เดือน</p>
                                <p className="text-2xl font-black text-yellow-400">฿{result.monthlyLimit.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">เฉลี่ยใช้ได้/วัน</p>
                                <p className="text-2xl font-black text-slate-800">฿{Math.floor(result.dailyLimit).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* คำเตือนสิทธิ์ภาษี */}
                        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
                            <div className="p-3 bg-white rounded-2xl text-amber-500 shadow-sm"><AlertTriangle /></div>
                            <p className="text-sm text-amber-900 leading-relaxed font-medium">
                                <strong>ระบบแจ้งเตือน:</strong> หากคุณออมเกินสิทธิ์ที่กฎหมายกำหนด (15-30% ของเงินได้) คุณจะยังเก็บเงินได้ตามเป้า แต่ส่วนที่เกินจะไม่สามารถนำไปลดหย่อนภาษีได้
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoalUser;