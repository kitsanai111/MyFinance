import React, { useState, useEffect, useMemo } from 'react';
import { Plus, AlertCircle, CheckCircle, X, Wallet, Edit2, Trash2, Tag, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// การนำเข้าไฟล์ภายในโปรเจกต์ (ตรวจสอบให้แน่ใจว่ามีไฟล์เหล่านี้อยู่ในโฟลเดอร์ที่ระบุ)
import api from '../../utils/api';
import useEcomStore from '../../store/ecom-store';

export default function BudgetUser() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // เพิ่ม 2 บรรทัดนี้
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    amount: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetRes, catRes] = await Promise.all([
        api.get(`/budget?month=${selectedMonth}&year=${selectedYear}`),
        api.get('/category')
      ]);
      setBudgets(budgetRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const expenseCategories = useMemo(() => {
    return categories.filter(cat => cat.type === 'expense');
  }, [categories]);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormData({ name: "", categoryId: "", amount: "" });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setIsEditMode(true);
    setEditId(item.id);
    setFormData({
      name: item.name || "",
      categoryId: item.categoryId,
      amount: item.amount
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "รายการนี้จะหายไปถาวร และไม่สามารถกู้คืนได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      customClass: {
        popup: 'font-sans rounded-[2.5rem]',
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/budget/${id}`);
        fetchData();
        toast.success("ลบข้อมูลสำเร็จ");
      } catch (err) {
        toast.error("เกิดข้อผิดพลาดในการลบ");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) return toast.warning("กรุณาเลือกหมวดหมู่");
    if (!formData.amount || Number(formData.amount) <= 0) return toast.warning("กรุณาระบุจำนวนเงิน");

    try {
      const payload = {
        name: formData.name,
        categoryId: Number(formData.categoryId),
        amount: Number(formData.amount),
        month: selectedMonth, 
        year: selectedYear
      };

      if (isEditMode) {
        await api.put(`/budget/${editId}`, payload);
        toast.success('แก้ไขงบประมาณสำเร็จ!');
      } else {
        await api.post('/budget', payload);
        toast.success('ตั้งงบประมาณสำเร็จ!');
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || "Server Error"));
    }
  };

  // การคำนวณวันคงเหลือในเดือนปัจจุบัน
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const today = new Date().getDate();
  const daysRemaining = Math.max(daysInMonth - today + 1, 1);

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500 font-bold">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans pb-24">
      {/* จัดการ Layout ให้กึ่งกลางและจำกัดความกว้างเพื่อความสวยงามบน Desktop */}
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ส่วนหัวของหน้า */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">งบประมาณรายเดือน</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <FileText size={14} />
              จัดการวงเงินแต่ละหมวดหมู่ประจำเดือน {new Date().toLocaleString('th-TH', { month: 'long' })}
            </p>

          </div>
          <div className="flex gap-4 items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <label className="font-black text-gray-700 ml-2">เลือกเดือน:</label>
            <select className="bg-gray-50 p-3 rounded-xl font-bold border" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {[...Array(12).keys()].map(i => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('th-TH', { month: 'long' })}</option>)}
            </select>
            <select className="bg-gray-50 p-3 rounded-xl font-bold border" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* ตารางแสดงงบประมาณ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* การ์ดสำหรับเพิ่มงบประมาณใหม่ */}
          <button
            onClick={openAddModal}
            className="flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-gray-400 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-all min-h-[240px] gap-4 group bg-white/50 shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center group-hover:bg-amber-100 transition-all duration-300 shadow-sm border border-gray-50">
              <Plus size={28} />
            </div>
            <div className="text-center">
              <span className="font-black text-lg block">เพิ่มงบประมาณใหม่</span>
              <span className="text-xs opacity-60">กำหนดวงเงินเพื่อควบคุมรายจ่าย</span>
            </div>
          </button>

          {budgets.map((item) => {
            const limit = Number(item.amount);
            const spent = Number(item.spent || 0);
            const percent = Math.min((spent / limit) * 100, 100);
            const isOver = spent > limit;

            let progressColor = 'bg-emerald-500';
            if (percent > 60) progressColor = 'bg-amber-400';
            if (percent > 85 || isOver) progressColor = 'bg-red-500';

            const remaining = Math.max(limit - spent, 0);
            const dailyCap = (remaining / daysRemaining).toFixed(0);

            return (
              <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden group flex flex-col justify-between min-h-[240px]">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl shadow-inner border border-gray-50">
                        {item.category?.icon || '📁'}
                      </div>
                      <div>
                        <h3 className="font-black text-gray-800 text-lg line-clamp-1">
                          {item.name || item.category?.name || 'งบประมาณ'}
                        </h3>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {item.name ? item.category?.name : 'รายเดือน'}
                        </div>
                      </div>
                    </div>
                    {isOver ? (
                      <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 border border-red-100">
                        <AlertCircle size={12} /> OVER
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 border border-emerald-100">
                        <CheckCircle size={12} /> SAFE
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm font-black items-baseline">
                      <span className={`text-xl ${isOver ? 'text-red-500' : 'text-gray-800'}`}>{spent.toLocaleString()} ฿</span>
                      <span className="text-gray-300 font-bold text-xs">งบ {limit.toLocaleString()} ฿</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-out shadow-sm`}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50">
                  <div className="flex-1 bg-gray-50/80 px-4 py-2.5 rounded-2xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">งบเฉลี่ยต่อวัน</span>
                    <span className={`text-sm font-black ${remaining <= 0 ? 'text-red-400' : 'text-gray-800'}`}>
                      {remaining > 0 ? `~${Number(dailyCap).toLocaleString()}` : '0'} <span className="text-[10px]">฿</span>
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(item)} className="p-3 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-2xl transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* หน้าต่าง Modal สำหรับเพิ่ม/แก้ไข */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 relative border border-gray-100 animate-in zoom-in-95">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900">{isEditMode ? "แก้ไขงบ" : "ตั้งงบใหม่"}</h2>
              <p className="text-sm text-gray-400 font-medium mt-1">ระบุวงเงินเพื่อควบคุมการใช้จ่ายให้เหมาะสม</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">ชื่องบประมาณ (ถ้ามี)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น งบกินเลี้ยง, ทริปญี่ปุ่น"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-amber-400 outline-none transition-all text-gray-700 font-bold"
                  />
                  <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">หมวดหมู่รายจ่าย</label>
                <div className="relative">
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    disabled={isEditMode}
                    className={`w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-amber-400 outline-none transition-all appearance-none text-gray-700 font-bold ${isEditMode ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {expenseCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">วงเงินงบประมาณ (บาท)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    className="w-full pl-5 pr-16 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-amber-400 outline-none transition-all text-2xl font-black text-gray-800"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-300">THB</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-black transition-all transform active:scale-95"
                >
                  {isEditMode ? "อัปเดตข้อมูล" : "เริ่มใช้งานงบนี้"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}