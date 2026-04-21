import React, { useState, useEffect, useMemo, useRef } from "react";
import useEcomStore from "../../store/ecom-store";
import api from "../../utils/api"; // ✅ เรียกใช้ API ตัวกลาง
import { toast } from 'react-toastify';
import {
  Wallet, TrendingUp, TrendingDown, Plus,
  Calendar as CalendarIcon, PieChart, ChevronLeft, ChevronRight,
  Edit3, Trash2, ArrowUpRight, ArrowDownRight, AlertCircle, LayoutDashboard
} from "lucide-react";
import Swal from 'sweetalert2';

export default function FinanceDashboard() {

  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [mode, setMode] = useState("day");

  // State สำหรับ Modal และ Form
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    categoryId: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // ดึง Token จาก Store เพื่อเอามา Decode หา UserID (ส่วน Header api.js จัดการให้)
  const token = useEcomStore((state) => state.token);

  // Helper decode token
  function decodeToken(token) {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch (e) {
      return null;
    }
  }

  // ✅ ฟังก์ชันดึงข้อมูล (Refactor ใหม่ ใช้ api.get)
  const fetchAllData = async () => {
    // ถ้าไม่มี Token ใน Store ไม่ต้องยิง
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [catRes, incomeRes, expenseRes, budgetRes] = await Promise.all([
        api.get('/category'),
        api.get('/income'),
        api.get('/expense'),
        api.get('/budget')
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setBudgets(Array.isArray(budgetRes.data) ? budgetRes.data : []); // ✅ เซ็ตข้อมูลงบ

      const inc = Array.isArray(incomeRes.data) ? incomeRes.data : [];
      const exp = Array.isArray(expenseRes.data) ? expenseRes.data : [];

      const normalized = [
        ...inc.map(i => ({ ...i, type: "income" })),
        ...exp.map(e => ({ ...e, type: "expense" })),
      ];
      setEntries(normalized);

    } catch (err) {
      console.error("fetch error:", err);
      // ไม่ต้องเช็ค 401 เองแล้ว api.js จัดการให้
    } finally {
      setLoading(false);
    }
  };

  const toastShownRef = useRef(false);

  const budgetAlerts = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return budgets.map(b => {
      const spent = entries
        .filter(e =>
          e.type === 'expense' &&
          e.categoryId === b.categoryId &&
          new Date(e.date).getMonth() === currentMonth &&
          new Date(e.date).getFullYear() === currentYear
        )
        .reduce((s, e) => s + Number(e.amount), 0);

      const limit = Number(b.amount);
      // ป้องกันการหารด้วยศูนย์
      const percent = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        name: b.name || b.category?.name,
        spent,
        limit,
        percent,
        // เพิ่มสถานะ CRITICAL สำหรับกรณีที่เกินงบไปมาก
        status: percent >= 100 ? 'OVER' : percent >= 80 ? 'WARNING' : 'SAFE'
      };
    }).filter(b => b.status !== 'SAFE');
  }, [budgets, entries]);

  // ระบบแจ้งเตือนผ่าน Toast
  useEffect(() => {
    // แจ้งเตือนเมื่อโหลดครั้งแรกหรือเมื่อข้อมูลมีการเปลี่ยนแปลง
    if (budgetAlerts.length > 0 && !toastShownRef.current) {
      budgetAlerts.forEach(alert => {
        const msg = `${alert.name} (ใช้ไป ${alert.percent.toFixed(0)}%)`;

        if (alert.status === 'OVER') {
          toast.error(`❌ เกินงบ! ${msg}`);
        } else if (alert.status === 'WARNING') {
          toast.warning(`⚠️ ใกล้เต็ม! ${msg}`);
        }
      });
      // ป้องกันไม่ให้เตือนซ้ำรัวๆ หากไม่อยากให้รำคาญ
      toastShownRef.current = true;
    }
  }, [budgetAlerts]);



  useEffect(() => {
    fetchAllData();
  }, [token]); // โหลดใหม่เมื่อ Token เปลี่ยน

  const mappedCategories = useMemo(() => {
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type || "expense",
      color: c.color || "#F59E0B",
      icon: c.icon || "📁",
    }));
  }, [categories]);

  const filteredEntries = useMemo(() => {
    // --- โหมดรายวัน ---
    if (mode === "day") {
      const todayStr = new Date().toISOString().split("T")[0];
      return entries.filter(e => new Date(e.date).toISOString().split("T")[0] === todayStr);
    }

    // --- โหมดรายสัปดาห์ (ใหม่!) ---
    if (mode === "week") {
      const now = new Date();
      // ปรับวันตาม offset (สัปดาห์นี้, สัปดาห์ที่แล้ว)
      now.setDate(now.getDate() + (monthOffset * 7));

      // หาวันจันทร์ของสัปดาห์นั้น
      const day = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      monday.setHours(0, 0, 0, 0);

      // หาวันอาทิตย์ของสัปดาห์นั้น
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return entries.filter(e => {
        const d = new Date(e.date);
        return d >= monday && d <= sunday;
      });
    }

    // --- โหมดรายเดือน ---
    if (mode === "month") {
      const now = new Date();
      now.setMonth(now.getMonth() + monthOffset);
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      return entries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });
    }

    if (mode === "year") {
      const targetYear = new Date().getFullYear() + monthOffset; // เลื่อนปีได้ด้วยถ้าต้องการ
      return entries.filter(e => new Date(e.date).getFullYear() === targetYear);
    }

    return entries;
  }, [mode, entries, monthOffset]);

  const currentVolume = useMemo(() =>
    filteredEntries.reduce((s, e) => s + Number(e.amount || 0), 0) || 1
    , [filteredEntries]);

  const popularCategories = useMemo(() => {
    const calculated = mappedCategories.map(cat => {
      const total = filteredEntries
        .filter(e => e.categoryId === cat.id && e.type === cat.type)
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      return { ...cat, total };
    });

    return calculated
      .filter(cat => cat.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [mappedCategories, filteredEntries]);

  const totals = useMemo(() => {
    const income = filteredEntries
      .filter(e => e.type === "income")
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const expense = filteredEntries
      .filter(e => e.type === "expense")
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    return { income, expense, balance: income - expense };
  }, [filteredEntries]);

  const allTimeBalance = useMemo(() => {
    const totalIncome = entries
      .filter(e => e.type === "income")
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalExpense = entries
      .filter(e => e.type === "expense")
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    return totalIncome - totalExpense;
  }, [entries]);

  const recent = useMemo(() => {
    return [...filteredEntries]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, mode === "day" ? undefined : 20)
      .map(e => ({
        raw: e,
        id: e.id,
        name: e.note || (mappedCategories.find(c => c.id === e.categoryId)?.name) || (e.source) || "รายการ",
        amount: Number(e.amount || 0),
        type: e.type,
        date: e.date.endsWith('Z') ? e.date.slice(0, -1) : e.date,
      }));

  }, [filteredEntries, mappedCategories, mode]);

  const calendar = useMemo(() => {
    const base = new Date();
    base.setMonth(base.getMonth() + monthOffset);
    base.setDate(1);
    const year = base.getFullYear();
    const month = base.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const calendarEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const entriesByDate = {};
    calendarEntries.forEach(e => {
      try {
        const day = new Date(e.date).toISOString().split("T")[0];
        entriesByDate[day] = entriesByDate[day] || [];
        entriesByDate[day].push(e);
      } catch (e) { }
    });

    return { year, month, cells, entriesByDate };
  }, [entries, monthOffset]);

  // --- CRUD FUNCTIONS ---

  const resetForm = () => {
    setFormData({
      type: "expense",
      amount: "",
      categoryId: "",
      note: "",
      date: new Date().toISOString().split("T")[0],
    });
    setIsEditMode(false);
    setEditId(null);
    setShowModal(false);
  };

  const handleEditClick = (item) => {
    setFormData({
      type: item.type,
      amount: item.amount,
      categoryId: item.categoryId || "",
      note: item.note || item.source || "",
      date: new Date(item.date).toISOString().split("T")[0],
    });
    setEditId(item.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDeleteClick = async (id, type) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "รายการนี้จะหายไปถาวร และไม่สามารถกู้คืนได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B', // สีส้ม Amber
      cancelButtonColor: '#9CA3AF',  // สีเทา
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true, // สลับตำแหน่งปุ่มให้ยกเลิกอยู่ซ้าย
      borderRadius: '2rem',
      customClass: {
        popup: 'font-sans rounded-[2.5rem]',
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/${type}/${id}`);
        fetchAllData();
        toast.success("ลบข้อมูลสำเร็จ");
      } catch (err) {
        console.error(err);
        toast.error("เกิดข้อผิดพลาดในการลบ");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("กรุณาเข้าสู่ระบบ");
      return;
    }

    try {
      const tokenData = decodeToken(token);
      const userId = tokenData?.userId || tokenData?.id;

      if (!userId) {
        toast.error("ไม่พบ User ID กรุณา login ใหม่");
        return;
      }

      if (formData.type === "income" && !formData.categoryId) {
        toast.warning("กรุณาเลือกหมวดหมู่สำหรับรายรับ");
        return;
      }

      // Check Goal Alert
      if (formData.type === "expense" && !isEditMode) {
        const savedGoal = localStorage.getItem('user_financial_goal');
        if (savedGoal) {
          const goal = JSON.parse(savedGoal);
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const currentMonthExpense = entries
            .filter(e =>
              e.type === 'expense' &&
              new Date(e.date).getMonth() === currentMonth &&
              new Date(e.date).getFullYear() === currentYear
            )
            .reduce((sum, e) => sum + Number(e.amount), 0);

          const newExpenseAmount = Number(formData.amount);
          const totalAfterAdd = currentMonthExpense + newExpenseAmount;

          if (goal.monthlyLimit > 0 && totalAfterAdd > goal.monthlyLimit) {
            const overAmount = totalAfterAdd - goal.monthlyLimit;
            const confirmSave = window.confirm(
              `⚠️ คำเตือน: คุณกำลังใช้จ่ายเกินเป้าหมายเดือนนี้!\n(เกินงบไปแล้ว ${overAmount.toLocaleString()} บาท)\nยืนยันที่จะบันทึก?`
            );
            if (!confirmSave) return;
          }
        }
      }

      let payload;
      if (formData.type === "income") {
        payload = {
          amount: Number(formData.amount),
          userId: Number(userId),
          source: formData.note || "รายรับ",
          categoryId: Number(formData.categoryId),
          date: formData.date,
        };
      } else {
        payload = {
          amount: Number(formData.amount),
          userId: Number(userId),
          note: formData.note || "รายจ่าย",
          date: formData.date,
        };
        if (formData.categoryId) {
          payload.categoryId = Number(formData.categoryId);
        }
      }

      let url;
      // ✅ ใช้ api.post หรือ api.put แทน
      if (isEditMode) {
        url = formData.type === "income" ? `/income/${editId}` : `/expense/${editId}`;
        await api.put(url, payload);
      } else {
        url = formData.type === "income" ? `/income` : `/expense`;
        await api.post(url, payload);
      }

      fetchAllData();
      resetForm();
      toast.success(isEditMode ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มข้อมูลสำเร็จ");

    } catch (err) {
      console.error("❌ Action error:", err);
      toast.error(`ดำเนินการไม่สำเร็จ: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {budgetAlerts.length > 0 && (
          <div className="space-y-3">
            {budgetAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-2xl border mb-3 flex items-center gap-4 ${alert.status === 'OVER'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
              >
                <AlertCircle size={24} />
                <div>
                  <p className="font-bold">
                    {alert.status === 'OVER' ? `แจ้งเตือน: งบ ${alert.name} เกินแล้ว!` : `แจ้งเตือน: งบ ${alert.name} ใกล้จะเต็มแล้ว`}
                  </p>
                  <p className="text-sm">
                    ใช้ไปแล้ว {alert.spent.toLocaleString()} / {alert.limit.toLocaleString()} บาท
                    ({alert.percent.toFixed(0)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">แดชบอร์ดการเงิน</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2"> <LayoutDashboard size={14} />  สรุปภาพรวมรายรับรายจ่ายของคุณ</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="group px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 rounded-2xl font-bold text-white shadow-lg shadow-yellow-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-md flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> เพิ่มรายการ
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* Left Column: Stats */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            {/* Main Balance Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden">
              {/* Decorative Circle */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full -mr-10 -mt-10 opacity-60"></div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-yellow-100 text-yellow-700 rounded-2xl">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-700">กระเป๋าเงินสุทธิ</span>
                </div>
              </div>

              <div className="text-center mb-8 relative z-10">
                <div className={`text-4xl font-extrabold tracking-tight ${allTimeBalance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                  {allTimeBalance.toLocaleString()} <span className="text-lg font-medium text-gray-400">฿</span>
                </div>
                <div className="text-xs text-gray-400 mt-1 font-medium bg-gray-50 inline-block px-3 py-1 rounded-full">ยอดรวมทั้งหมด (All Time)</div>
              </div>

              {/* Toggles */}
              <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6 relative z-10">
                <button onClick={() => { setMode("day"); setMonthOffset(0); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === "day" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>รายวัน</button>
                <button onClick={() => { setMode("week"); setMonthOffset(0); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === "week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>รายสัปดาห์</button>
                <button onClick={() => { setMode("month"); setMonthOffset(0); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === "month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>รายเดือน</button>
                <button onClick={() => { setMode("year"); setMonthOffset(0); }} className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${mode === "year" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>รายปี</button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100 flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5 text-green-700 mb-1">
                    <div className="p-1 bg-white rounded-full shadow-sm"><ArrowDownRight size={12} /></div>
                    <span className="text-xs font-bold">รายรับ</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">+{totals.income.toLocaleString()}</div>
                </div>

                <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5 text-red-600 mb-1">
                    <div className="p-1 bg-white rounded-full shadow-sm"><ArrowUpRight size={12} /></div>
                    <span className="text-xs font-bold">รายจ่าย</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">-{totals.expense.toLocaleString()}</div>
                </div>
              </div>

              {/* Balance for period */}
              <div className="mt-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">
                  คงเหลือ ({mode === 'day' ? 'วันนี้' : mode === 'week' ? 'สัปดาห์นี้' : mode === 'month' ? 'เดือนนี้' : 'ปีนี้'})
                </span>
                <span className={`text-lg font-bold ${totals.balance >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
                  {totals.balance.toLocaleString()} ฿
                </span>
              </div>
            </div>

            {/* Categories Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <PieChart size={18} className="text-yellow-500" /> หมวดหมู่ยอดนิยม
                </h3>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  {mode === 'day' ? 'วันนี้' : mode === 'week' ? 'สัปดาห์นี้' : mode === 'month' ? 'เดือนนี้' : 'ปีนี้'}
                </span>
              </div>
              <div className="space-y-3">
                {popularCategories.length > 0 ? (
                  popularCategories.map(cat => {
                    const percent = Math.min((cat.total / currentVolume) * 100, 100);

                    return (
                      <div key={cat.id} className="relative group cursor-default">
                        <div className="flex items-center justify-between p-2 relative z-10">
                          <div className="flex items-center gap-3">
                            <div style={{ background: cat.color }} className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm text-lg">
                              {cat.icon}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-700">{cat.name}</div>
                              <div className="text-[10px] text-gray-400 font-medium">{cat.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-700">{cat.total.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-400 font-medium">{percent.toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">ไม่มีรายการ{mode === 'day' ? 'วันนี้' : mode === 'week' ? 'สัปดาห์นี้' : mode === 'month' ? 'เดือนนี้' : 'ปีนี้'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">

            {/* Recent Transactions */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {/* 🚩 เปลี่ยนชื่อหัวข้อตามโหมดที่เลือก */}
                    {mode === 'day' ? 'วันนี้' : mode === 'week' ? 'สัปดาห์นี้' : mode === 'month' ? 'เดือนนี้' : 'ปีนี้'}
                  </h3>
                </div>
                <div className="bg-yellow-50 text-yellow-700 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider">
                  {/* โชว์จำนวนรายการที่กรองแล้ว */}
                  {recent.length} รายการ
                </div>
              </div>

              <div className="space-y-2">
                {recent.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100">
                    {/* ... (โค้ดแสดงผลรายการ r.type, r.name, r.amount ของนายเหมือนเดิม) ... */}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110 ${r.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {r.type === 'income' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-sm md:text-base">{r.name}</div>
                        <div className="text-xs text-gray-400 mt-1 font-medium bg-gray-100 px-2 py-0.5 rounded-md inline-block">
                          {new Date(r.date).toLocaleString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className={`font-bold text-base md:text-lg ${r.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {r.type === 'income' ? `+` : `-`} {r.amount.toLocaleString()}
                      </div>
                      {/* ปุ่มแก้ไข/ลบ */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => handleEditClick(r.raw)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(r.id, r.type)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 🚩 ข้อความเมื่อไม่มีรายการในช่วงเวลานั้น */}
                {recent.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm font-medium">
                    ยังไม่มีรายการของ{mode === 'day' ? 'วันนี้' : mode === 'week' ? 'สัปดาห์นี้' : 'เดือนนี้'}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <CalendarIcon size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-700">ปฏิทิน</h3>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
                  <button onClick={() => setMonthOffset(m => m - 1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 transition-all"><ChevronLeft size={16} /></button>
                  <div className="px-3 text-sm font-bold text-gray-700 w-28 text-center">{new Date(calendar.year, calendar.month).toLocaleString('th-TH', { month: 'long', year: 'numeric' })}</div>
                  <button onClick={() => setMonthOffset(m => m + 1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 transition-all"><ChevronRight size={16} /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-xs text-center font-bold text-gray-400 mb-3 uppercase tracking-wider">
                <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendar.cells.map((cell, idx) => {
                  if (!cell) return <div key={idx} className="h-24 rounded-2xl bg-gray-50/30"></div>;
                  const dateKey = `${cell.getFullYear()}-${(cell.getMonth() + 1).toString().padStart(2, '0')}-${cell.getDate().toString().padStart(2, '0')}`;
                  const dayEntries = calendar.entriesByDate[dateKey] || [];
                  const isToday = new Date().toDateString() === cell.toDateString();

                  return (
                    <div key={idx} className={`h-24 border ${isToday ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-100'} rounded-2xl p-2 relative flex flex-col hover:border-yellow-300 hover:shadow-md transition-all group overflow-hidden`}>
                      <div className={`text-xs font-bold mb-1 ${isToday ? 'text-yellow-700' : 'text-gray-400 group-hover:text-gray-600'}`}>{cell.getDate()}</div>
                      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                        {dayEntries.slice(0, 3).map((de, i) => (
                          <div key={i} className={`h-1.5 w-full rounded-full ${de.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} title={`${de.amount} บาท`}></div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</h2>
                <p className="text-sm text-gray-400 mt-1">กรอกรายละเอียดธุรกรรมของคุณ</p>
              </div>
              <button onClick={resetForm} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">×</button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                <button type="button" disabled={isEditMode} onClick={() => setFormData({ ...formData, type: "income" })}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${formData.type === "income" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"} ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <TrendingUp size={18} /> รายรับ
                </button>
                <button type="button" disabled={isEditMode} onClick={() => setFormData({ ...formData, type: "expense" })}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${formData.type === "expense" ? "bg-white text-red-500 shadow-sm" : "text-gray-500 hover:text-gray-700"} ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <TrendingDown size={18} /> รายจ่าย
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">จำนวนเงิน</label>
                <div className="relative">
                  <input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-4 pr-16 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-yellow-400 outline-none transition-all text-xl font-bold text-gray-800 placeholder-gray-300" placeholder="0.00" />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">THB</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">หมวดหมู่</label>
                <div className="relative">
                  <select required={formData.type === "income"} value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-yellow-400 outline-none transition-all appearance-none text-gray-700 font-medium cursor-pointer">
                    <option value="">เลือกหมวดหมู่{formData.type === "expense" ? " (ไม่บังคับ)" : ""}</option>
                    {mappedCategories.filter((c) => c.type === formData.type).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">บันทึกช่วยจำ</label>
                <input type="text" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-yellow-400 outline-none transition-all text-gray-700" placeholder="ระบุรายละเอียด..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">วันที่</label>
                <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-yellow-400 outline-none transition-all text-gray-700 font-medium" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-all">ยกเลิก</button>
                <button onClick={handleSubmit} className="flex-[2] py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-yellow-200 transition-all transform active:scale-95">
                  {isEditMode ? "อัปเดตข้อมูล" : "บันทึกรายการ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}