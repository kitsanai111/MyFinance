import { useEffect, useState, useMemo } from "react";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Target, TrendingUp, CalendarRange, Wallet,
  PieChart as PieIcon, BarChart3, LineChart, Layers,
  ArrowUpRight, ArrowDownRight, Activity, CalendarClock
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { useNavigate } from 'react-router-dom';
import useEcomStore from "../../store/ecom-store";
import api from "../../utils/api";

// ลงทะเบียน Components
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Title
);

const ReportPage = () => {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [installments, setInstallments] = useState([]); // ✅ เพิ่ม State สำหรับยอดผ่อน
  const [totals, setTotals] = useState({});
  const [retirementGoal, setRetirementGoal] = useState({ target: 0, saved: 0 });
  const [chartType, setChartType] = useState("bar");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = useEcomStore((state) => state.token);
  const currentYear = new Date().getFullYear();
  const [yearSummary, setYearSummary] = useState(null);
  const openingBalance = yearSummary?.openingBalance || 0;

  const [startYear, setStartYear] = useState(currentYear - 1);
  const [endYear, setEndYear] = useState(currentYear);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }


    const fetchData = async () => {
      setLoading(true);
      try {
        const [incomeRes, expenseRes, totalsRes, goalRes, installmentRes] = await Promise.all([
          api.get('/income?count=2000'),
          api.get('/expense?count=2000'),
          api.get('/total'),
          api.get('/goal'),
          api.get('/installment') // ✅ ดึงข้อมูลยอดผ่อนชำระ
        ]);


        setIncomes(incomeRes.data);
        setExpenses(expenseRes.data);
        setTotals(totalsRes.data);
        setInstallments(installmentRes.data || []); // ✅ บันทึกข้อมูลยอดผ่อน

        const summaryRes = await api.get(`/summary/year/${currentYear}`);
        setYearSummary(summaryRes.data);

        // ดึง Goal
        const targetAmount = Number(goalRes.data?.totalGoal) || 0;
        const currentSaved = totalsRes.data.total || 0;

        setRetirementGoal({
          target: targetAmount,
          saved: currentSaved
        });

      } catch (err) {
        console.error("Error fetching data:", err);
        setRetirementGoal({ target: 0, saved: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, currentYear]);

  const monthlyData = useMemo(() => {
    // สร้าง Array ว่าง 12 เดือน [0, 0, ..., 0]
    const incomeByMonth = Array(12).fill(0);
    const expenseByMonth = Array(12).fill(0);

    // Group รายรับ
    incomes.forEach(item => {
      const d = new Date(item.date);
      if (d.getFullYear() === currentYear) {
        incomeByMonth[d.getMonth()] += Number(item.amount || 0);
      }
    });

    // Group รายจ่าย
    expenses.forEach(item => {
      const d = new Date(item.date);
      if (d.getFullYear() === currentYear) {
        expenseByMonth[d.getMonth()] += Number(item.amount || 0);
      }
    });
    return { incomeByMonth, expenseByMonth };
  }, [incomes, expenses, currentYear]);

  const getMonthlyByYear = (year) => {
    const income = Array(12).fill(0);
    const expense = Array(12).fill(0);

    incomes.forEach(item => {
      const d = new Date(item.date);
      if (d.getFullYear() === year) {
        income[d.getMonth()] += Number(item.amount || 0);
      }
    });

    expenses.forEach(item => {
      const d = new Date(item.date);
      if (d.getFullYear() === year) {
        expense[d.getMonth()] += Number(item.amount || 0);
      }
    });

    return { income, expense };
  };

  // ปีย้อนหลัง
  const yearlyData = useMemo(() => {
    const map = {};

    incomes.forEach(item => {
      const year = new Date(item.date).getFullYear();
      if (!map[year]) map[year] = { income: 0, expense: 0 };
      map[year].income += Number(item.amount || 0);
    });

    expenses.forEach(item => {
      const year = new Date(item.date).getFullYear();
      if (!map[year]) map[year] = { income: 0, expense: 0 };
      map[year].expense += Number(item.amount || 0);
    });

    return map;
  }, [incomes, expenses]);

  const yearOptions = Object.keys(yearlyData)
    .map(Number)
    .sort((a, b) => a - b);


  const sortedYears = Object.keys(yearlyData)
    .map(Number)
    .sort((a, b) => a - b);


  const yearlyInsight = useMemo(() => {
    const years = Object.keys(yearlyData)
      .map(Number)
      .sort((a, b) => a - b);
    if (years.length < 2) return null;

    const lastYear = yearlyData[years[years.length - 2]];
    const thisYear = yearlyData[years[years.length - 1]];

    const incomeDiff = thisYear.income - lastYear.income;
    const expenseDiff = thisYear.expense - lastYear.expense;

    return {
      incomeDiff,
      expenseDiff
    };
  }, [yearlyData]);

  // ✅ คำนวณยอดผ่อนรวมต่อเดือน (เฉพาะรายการที่ยังผ่อนไม่จบ)
  const totalMonthlyInstallment = useMemo(() => {
    return installments
      .filter(item => (item.currentTerm || 0) < item.totalTerms)
      .reduce((acc, item) => acc + Number(item.monthlyAmount || 0), 0);
  }, [installments]);

  // คำนวณยอดปีปัจจุบัน
  const totalIncome = useMemo(() =>
    incomes
      .filter(item => new Date(item.date).getFullYear() === currentYear)
      .reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [incomes, currentYear]);

  const totalExpense = useMemo(() =>
    expenses
      .filter(item => new Date(item.date).getFullYear() === currentYear)
      .reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [expenses, currentYear]);

  // Config กราฟ
  const getChartData = () => {
    const labels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    const datasets = [];

    const coolColors = [
      "#10B981", // green
      "#3B82F6", // blue
      "#06B6D4", // cyan
      "#6366F1", // indigo
      "#14B8A6", // teal
    ];

    const warmColors = [
      "#EF4444", // red
      "#F97316", // orange
      "#F59E0B", // amber
      "#DC2626", // dark red
      "#EA580C", // deep orange
    ];

    let colorIndex = 0;

    for (let year = startYear; year <= endYear; year++) {
      const data = getMonthlyByYear(year);

      const incomeColor = coolColors[colorIndex % coolColors.length];
      const expenseColor = warmColors[colorIndex % warmColors.length];

      // ✅ รายรับ (โทนเย็น)
      datasets.push({
        label: `รายรับ ${year}`,
        data: data.income,
        borderColor: incomeColor,
        backgroundColor: incomeColor,
        tension: 0.4,
      });

      // ✅ รายจ่าย (โทนร้อน)
      datasets.push({
        label: `รายจ่าย ${year}`,
        data: data.expense,
        borderColor: expenseColor,
        backgroundColor: expenseColor,
        borderDash: [6, 6], // ทำให้ดูต่างจาก income
        tension: 0.4,
      });

      colorIndex++;
    }

    return { labels, datasets };
  };

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'ui-sans-serif, system-ui' } } },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 12,
          displayColors: true
        }
      },
      layout: { padding: 10 }
    };

    if (chartType === 'stacked') {
      return {
        ...baseOptions,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, grid: { color: '#F3F4F6' }, border: { display: false } }
        }
      };
    }

    if (chartType === 'bar' || chartType === 'line') {
      return {
        ...baseOptions,
        scales: {
          y: { beginAtZero: true, grid: { color: '#F3F4F6' }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false } }
        }
      };
    }

    return baseOptions;
  };

  // เพิ่มฟังก์ชันนี้เพื่อคำนวณภาระผ่อนรายเดือนแบบ Dynamic
  const getMonthlyInstallment = (year, monthIndex) => {
    return installments.reduce((sum, item) => {
      const startDate = new Date(item.startDate);
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();

      // คำนวณลำดับเดือนที่ผ่านไปนับจากวันที่เริ่มผ่อน
      const monthDiff = (year - startYear) * 12 + (monthIndex - startMonth);

      // ถ้า monthDiff อยู่ระหว่าง 0 ถึง totalTerms - 1 แปลว่าต้องจ่ายงวดนี้
      if (monthDiff >= 0 && monthDiff < item.totalTerms) {
        return sum + Number(item.monthlyAmount || 0);
      }
      return sum;
    }, 0);
  };

  const availableYears = useMemo(() => {
    const years = new Set();

    // 1. เพิ่มปีปัจจุบันไว้ก่อนเสมอ
    years.add(new Date().getFullYear());

    // 2. ดึงปีจากรายการผ่อนชำระ
    installments.forEach(item => {
      if (item.startDate) years.add(new Date(item.startDate).getFullYear());
    });

    // 3. ดึงปีจากรายการรายรับ
    incomes.forEach(item => {
      if (item.date) years.add(new Date(item.date).getFullYear());
    });

    // 4. ดึงปีจากรายการรายจ่าย
    expenses.forEach(item => {
      if (item.date) years.add(new Date(item.date).getFullYear());
    });

    // เรียงลำดับจากน้อยไปมาก
    return Array.from(years).sort((a, b) => a - b);
  }, [installments, incomes, expenses]);



  const getOpeningBalance = (year) => {
    let balance = 0;

    incomes.forEach(item => {
      const d = new Date(item.date);
      if (d.getFullYear() < year) {
        balance += Number(item.amount || 0);
      }
    });

    expenses.forEach(item => {
      const d = new Date(item.date);
      if (d.getFullYear() < year) {
        balance -= Number(item.amount || 0);
      }
    });

    installments.forEach(item => {
      const startDate = new Date(item.startDate);

      for (let i = 0; i < item.totalTerms; i++) {
        const payDate = new Date(startDate);
        payDate.setMonth(startDate.getMonth() + i);

        if (payDate.getFullYear() < year) {
          balance -= Number(item.monthlyAmount || 0);
        }
      }
    });

    return balance;
  };


  const renderChart = () => {
    const data = getChartData();
    const options = getChartOptions();


    switch (chartType) {
      case "bar": return <Bar data={data} options={options} />;
      case "stacked": return <Bar data={data} options={options} />;
      case "line": return <Line data={data} options={options} />;
    }
  };

  const retirementPercent = retirementGoal.target > 0
    ? Math.min((retirementGoal.saved / retirementGoal.target) * 100, 100)
    : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse text-gray-400 font-bold">กำลังประมวลผลข้อมูล...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">รายงานสรุปผล</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <CalendarRange size={14} /> ข้อมูลประจำปี {currentYear}
            </p>
          </div>
          <div className="hidden md:block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl font-bold text-sm shadow-sm">
            Year: {currentYear}
          </div>
        </div>

        {/* --- Summary Cards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

          {/* Total Balance (All Time) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-2xl shadow-sm">
                  <Wallet size={20} />
                </div>
                <span className="text-sm font-bold text-gray-500">ยอดเงินคงเหลือทั้งหมด</span>
              </div>
              <div className="text-2xl font-extrabold text-gray-800">
                {totals?.total?.toLocaleString() ?? 0} <span className="text-sm text-gray-400 font-medium">฿</span>
              </div>
            </div>
          </div>

          {/* Income (Yearly) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-2xl shadow-sm">
                  <ArrowDownRight size={20} />
                </div>
                <span className="text-sm font-bold text-gray-500">รายรับปีนี้ </span>
              </div>
              <div className="text-2xl font-extrabold text-green-600">
                +{totalIncome.toLocaleString()} <span className="text-sm text-gray-400 font-medium">฿</span>
              </div>
            </div>
          </div>

          {/* Expense (Yearly) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm">
                  <ArrowUpRight size={20} />
                </div>
                <span className="text-sm font-bold text-gray-500">รายจ่ายปีนี้ </span>
              </div>
              <div className="text-2xl font-extrabold text-red-500">
                -{totalExpense.toLocaleString()} <span className="text-sm text-gray-400 font-medium">฿</span>
              </div>
            </div>
          </div>

          {/* ✅ ยอดผ่อนรายเดือน (New!) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                  <CalendarClock size={20} />
                </div>
                <span className="text-sm font-bold text-gray-500">ภาระผ่อนต่อเดือน</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-600">
                {totalMonthlyInstallment.toLocaleString()} <span className="text-sm text-gray-400 font-medium">฿</span>
              </div>
            </div>
          </div>

          {/* Remaining (Yearly) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
                  <Activity size={20} />
                </div>
                <span className="text-sm font-bold text-gray-500">เงินเหลือปีนี้ </span>
              </div>
              <div className={`text-2xl font-extrabold ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                {(yearSummary?.net ?? 0).toLocaleString()} <span className="text-sm text-gray-400 font-medium">฿</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Chart Section (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 ">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <PieIcon className="text-yellow-500" size={20} /> ภาพรวมการเงิน
              </h2>
              <div className="flex gap-2 items-center">
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  {yearOptions.map(y => <option key={y}>{y}</option>)}
                </select>

                <span>-</span>

                <select
                  value={endYear}
                  onChange={(e) => setEndYear(Math.max(startYear, Number(e.target.value)))}
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  {yearOptions.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="bg-gray-100 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-sm border">
                {[
                  { id: 'bar', icon: <BarChart3 size={16} /> },
                  { id: 'line', icon: <LineChart size={16} /> },
                  { id: 'stacked', icon: <Layers size={16} /> },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setChartType(type.id)}
                    className={`p-2 rounded-xl transition-all shadow-sm ${chartType === type.id
                      ? 'bg-white text-yellow-600 shadow-md'
                      : 'text-gray-400 hover:text-gray-600 bg-transparent shadow-none'
                      }`}
                  >
                    {type.icon}
                  </button>
                ))}
              </div>

            </div>

            <div className="h-[350px] w-full relative bg-gray-50/30 rounded-2xl border border-gray-50 p-4">
              {renderChart()}
            </div>

            {yearlyInsight && (

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Income Insight */}
                <div className={`p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-1
  ${yearlyInsight.incomeDiff >= 0
                    ? "bg-blue-50 border-blue-100"
                    : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">รายรับ</span>
                    <div className="text-xs text-gray-400">เทียบกับปีก่อน</div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold
  ${yearlyInsight.incomeDiff >= 0
                        ? "bg-blue-100 text-green-700"
                        : "bg-slate-200 text-red-600"
                      }`}
                    >
                      {yearlyInsight.incomeDiff >= 0 ? "เพิ่มขึ้น" : "ลดลง"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {yearlyInsight.incomeDiff >= 0 ? (
                      <ArrowUpRight className="text-green-500" size={18} />
                    ) : (
                      <ArrowDownRight className="text-red-500" size={18} />
                    )}
                    <span className={`text-lg font-bold
          ${yearlyInsight.incomeDiff >= 0 ? "text-green-600" : "text-red-500"}
        `}>
                      {Math.abs(yearlyInsight.incomeDiff).toLocaleString()} ฿
                    </span>
                  </div>
                </div>

                {/* Expense Insight */}
                <div className={`p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-1
  ${yearlyInsight.expenseDiff > 0
                    ? "bg-red-50 border-red-100"
                    : "bg-orange-50 border-orange-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">รายจ่าย</span>
                    <div className="text-xs text-gray-400">เทียบกับปีก่อน</div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold
          ${yearlyInsight.expenseDiff <= 0
                        ? "bg-red-100 text-green-700" //ลดลง
                        : "bg-orange-100 text-red-700" //เพิ่มขึ้น
                      }`}
                    >
                      {yearlyInsight.expenseDiff >= 0 ? "เพิ่มขึ้น" : "ลดลง"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {yearlyInsight.expenseDiff >= 0 ? (
                      <ArrowUpRight className="text-red-700" size={18} /> //ใช้จ่ายเยอะ
                    ) : (
                      <ArrowDownRight className="text-green-700" size={18} /> //ใช้จ่ายน้อย
                    )}
                    <span className={`text-lg font-bold
          ${yearlyInsight.expenseDiff <= 0 ? "text-green-600" : "text-red-600"}
        `}>
                      {Math.abs(yearlyInsight.expenseDiff).toLocaleString()} ฿
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* --- Monthly Summary Table --- */}
            <div className="mt-8 bg-white rounded-[2rem] p-6 shadow-sm border">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <CalendarClock className="text-purple-500" size={20} /> สรุปข้อมูลรายเดือน

                <select
                  className="bg-gray-50 p-3 rounded-xl font-bold border"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="pb-4 text-left font-bold">เดือน</th>
                      <th className="pb-4 text-right font-bold">รายรับ</th>
                      <th className="pb-4 text-right font-bold">รายจ่าย</th>
                      <th className="pb-4 text-right font-bold">ภาระผ่อน</th>
                      <th className="pb-4 text-right font-bold">คงเหลือสุทธิ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(() => {
                      // 1. กำหนดเงินต้นปีเป็นตัวตั้งต้น
                      let runningBalance = getOpeningBalance(selectedYear);

                      const { income, expense } = getMonthlyByYear(selectedYear);

                      return [...Array(12).keys()].map((monthIndex) => {

                        const monthlyIncome = income[monthIndex] || 0;
                        const monthlyExpense = expense[monthIndex] || 0;
                        const installment = getMonthlyInstallment(selectedYear, monthIndex);

                        const monthlyNet = monthlyIncome - monthlyExpense - installment;
                        runningBalance += monthlyNet;

                        // console.log(selectedYear, income, expense);

                        return (
                          <tr key={monthIndex} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 font-bold text-gray-700">
                              {new Date(selectedYear, monthIndex).toLocaleString('th-TH', { month: 'long' })}
                            </td>
                            <td className="py-4 text-right text-green-600 font-medium">
                              {monthlyIncome > 0 ? `+${monthlyIncome.toLocaleString()}` : "-"}
                            </td>
                            <td className="py-4 text-right text-red-500 font-medium">
                              {monthlyExpense > 0 ? `-${monthlyExpense.toLocaleString()}` : "-"}
                            </td>
                            <td className="py-4 text-right text-amber-600 font-medium">
                              {installment > 0 ? `-${installment.toLocaleString()}` : "-"}
                            </td>
                            {/* ตรงนี้คือยอดเงินสะสมรวมถึงเดือนปัจจุบัน */}
                            <td className={`py-4 text-right font-black ${runningBalance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                              {runningBalance.toLocaleString()} ฿
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>


          {/* Retirement Goal (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Goal Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-6 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -ml-10 -mb-10"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Target className="text-yellow-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">เป้าหมาย</h3>
                    <p className="text-xs text-gray-400">Financial Freedom</p>
                  </div>
                </div>

                {retirementGoal.target > 0 ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-400">ความคืบหน้า</div>
                        <div className="text-2xl font-bold">{retirementPercent.toFixed(1)}%</div>
                      </div>

                      <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-amber-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                          style={{ width: `${retirementPercent}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-700/50">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">เป้าหมาย</div>
                          <div className="font-bold text-lg">{retirementGoal.target.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 mb-1">ทำได้แล้ว</div>
                          <div className="font-bold text-lg text-yellow-400">{retirementGoal.saved.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="mt-2 text-center">
                        {retirementGoal.saved < retirementGoal.target && (
                          <span className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                            ขาดอีก {(retirementGoal.target - retirementGoal.saved).toLocaleString()} ฿
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">คุณยังไม่ได้ตั้งเป้าหมาย</p>
                    <button
                      onClick={() => navigate('/user/goal')}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-xl text-sm transition-all">
                      ตั้งเป้าหมายตอนนี้
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tip Card */}
            <div className="bg-yellow-50 rounded-[2rem] p-6 border border-yellow-100">
              <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-2">
                <Activity size={16} /> วิเคราะห์หนี้สิน
              </h4>
              <p className="text-sm text-yellow-700 leading-relaxed">
                ยอดผ่อนชำระ {totalMonthlyInstallment.toLocaleString()} บาท/เดือน {totalMonthlyInstallment > 0 ? 'ถือเป็นภาระผูกพันที่คุณต้องเตรียมเงินสำรองไว้ให้พร้อม' : 'เยี่ยมมาก! คุณไม่มีภาระผูกพันการผ่อนชำระในขณะนี้'}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
