import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckSquare, Plus, Trash2, X, Pencil, AlertCircle, TrendingDown
} from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

import api from '../../utils/api';
import useEcomStore from '../../store/ecom-store';

const InstallmentModal = ({ isOpen, onClose, onSave, initialData, salary, currentTotalMonthly }) => {
  const [formData, setFormData] = useState({ name: '', totalPrice: '', totalTerms: '', startDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        totalPrice: initialData.totalPrice,
        totalTerms: initialData.totalTerms
      });
    } else {
      setFormData({ name: '', totalPrice: '', totalTerms: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.totalPrice || !formData.totalTerms) {
      return toast.warn("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
    onSave(formData);
  };

  // คำนวณภาระหนี้จำลอง
  const newMonthlyAmount = (Number(formData.totalPrice) || 0) / (Number(formData.totalTerms) || 1);
  const totalDebtIfAdded = currentTotalMonthly + newMonthlyAmount;
  const newDsrPercentage = salary > 0 ? ((totalDebtIfAdded / salary) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 border border-gray-100">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
            {initialData ? <Pencil size={20} /> : <Plus size={20} />}
          </div>
          {initialData ? 'แก้ไขรายการผ่อน' : 'เพิ่มรายการผ่อน'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">ชื่อรายการ</label>
            <input type="text" placeholder="เช่น iPhone 16, ประกันรถยนต์"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-amber-400 outline-none transition-all font-bold text-gray-700"
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">ราคาเต็ม (฿)</label>
              <input type="number" placeholder="30000"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-amber-400 outline-none transition-all font-bold text-gray-700"
                value={formData.totalPrice} onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">วันเริ่มจ่ายงวดแรก</label>
              <input type="date"
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold text-gray-700"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">จำนวนงวด (เดือน)</label>
              <input type="number" placeholder="10"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-amber-400 outline-none transition-all font-bold text-gray-700"
                value={formData.totalTerms} onChange={(e) => setFormData({ ...formData, totalTerms: e.target.value })}
              />
            </div>
          </div>

          {/* DSR Check Warning */}
          {!initialData && newMonthlyAmount > 0 && salary > 0 && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-sm transition-all ${newDsrPercentage > 40 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <strong>ยอดผ่อน: ฿{newMonthlyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}/เดือน</strong>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  ถ้าเพิ่มรายการนี้ ภาระหนี้รวมของคุณจะกลายเป็น <strong>{newDsrPercentage}%</strong> ของเงินเดือน
                  {newDsrPercentage > 40 && " ⚠️ คำเตือน: เกินเกณฑ์มาตรฐานที่ 40% ควรระวังเรื่องสภาพคล่อง"}
                </p>
              </div>
            </div>
          )}

          <button type="submit" className="w-full mt-4 bg-amber-500 text-white font-black py-4 rounded-2xl hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all transform active:scale-95">
            {initialData ? 'อัปเดตข้อมูล' : 'บันทึกรายการใหม่'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function InstallmentUser() {
  const [installments, setInstallments] = useState([]);
  const [salary, setSalary] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const user = useEcomStore(s => s.user);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resInst = await api.get('/installment');
      setInstallments(resInst.data || []);

      try {
        const resGoal = await api.get('/goal');
        if (resGoal.data && resGoal.data.salary) {
          setSalary(Number(resGoal.data.salary));
        }
      } catch (err) {
        console.log("Goal not set yet");
      }

    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🔴 แก้ไขใน InstallmentUser.js (React)
  const togglePaid = async (item) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการชำระเงิน?',
      text: `ระบบจะบันทึกค่างวดและสร้างรายจ่ายจำนวน ฿${Number(item.monthlyAmount).toLocaleString()} ให้อัตโนมัติ`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonText: 'ยกเลิก',
      confirmButtonText: 'ยืนยันการจ่าย'
    });

    if (!confirm.isConfirmed) return;

    try {
      // ✅ ส่งแค่ API ตัวเดียวพอ Backend จัดการที่เหลือเองทั้งหมด
      await api.put(`/installment/pay/${item.id}`);

      fetchData(); // รีเฟรชข้อมูล
      toast.success('ชำระเงินและบันทึกเรียบร้อย! 🎉');
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "รายการนี้จะหายไปถาวร!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'ลบเลย'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/installment/${id}`);
        fetchData();
        toast.success("ลบข้อมูลสำเร็จ");
      } catch (err) { toast.error("เกิดข้อผิดพลาดในการลบ"); }
    }
  };

  const handleSave = async (data) => {
    const { name, totalPrice, totalTerms } = data;
    const monthlyAmount = Number(totalPrice) / Number(totalTerms);

    try {
      if (editData) {
        await api.put(`/installment/${editData.id}`, {
          name, totalPrice: Number(totalPrice), totalTerms: Number(totalTerms), monthlyAmount
        });
        toast.success('แก้ไขข้อมูลสำเร็จ');
      } else {
        await api.post('/installment', {
          name, totalPrice: Number(totalPrice), totalTerms: Number(totalTerms),
          monthlyAmount, startDate: new Date().toISOString()
        });
        toast.success('เพิ่มรายการสำเร็จ');
      }
      setIsModalOpen(false);
      setEditData(null);
      fetchData();
    } catch (err) { toast.error('ดำเนินการไม่สำเร็จ'); }
  };

  const totalToPay = installments.reduce((sum, item) => sum + Number(item.monthlyAmount), 0);
  const dsrPercentage = salary > 0 ? ((totalToPay / salary) * 100).toFixed(1) : 0;

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans pb-24">

      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            รายการผ่อนชำระ
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">ติดตามยอดผ่อนรายเดือนและภาระหนี้ของคุณ</p>
        </div>
        <div className="bg-white px-8 py-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-8">
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">ต้องจ่ายเดือนนี้</div>
            <div className="text-2xl font-black text-gray-900">{totalToPay.toLocaleString()} <span className="text-sm font-medium text-gray-400">฿</span></div>
          </div>
        </div>


        {salary > 0 ? (
          <div className={`p-5 rounded-3xl flex items-start gap-4 border shadow-sm ${dsrPercentage > 40 ? 'bg-red-50 border-red-200' :
            dsrPercentage > 30 ? 'bg-yellow-50 border-yellow-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
            <div className={`p-3 rounded-2xl ${dsrPercentage > 40 ? 'bg-red-100 text-red-600' : dsrPercentage > 30 ? 'bg-yellow-100 text-yellow-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {dsrPercentage > 40 ? <TrendingDown size={28} /> : <AlertCircle size={28} />}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${dsrPercentage > 40 ? 'text-red-800' : dsrPercentage > 30 ? 'text-yellow-800' : 'text-emerald-800'}`}>
                วิเคราะห์ภาระหนี้สิน (DSR)
              </h3>
              <p className={`text-sm mt-1 leading-relaxed ${dsrPercentage > 40 ? 'text-red-600' : dsrPercentage > 30 ? 'text-yellow-700' : 'text-emerald-700'}`}>
                ยอดผ่อนชำระรวมคิดเป็น <strong>{dsrPercentage}%</strong> ของเงินเดือน ({salary.toLocaleString()} บาท) <br />
                {dsrPercentage > 40 ? "⚠️ ภาระหนี้สูงมาก! เกินเกณฑ์มาตรฐานที่ 40% คุณควรงดสร้างหนี้เพิ่มเด็ดขาด" :
                  dsrPercentage > 30 ? "⚠️ เริ่มตึงมือ! ภาระหนี้ใกล้แตะ 40% ควรระมัดระวังการใช้จ่าย" :
                    "✅ สถานะการเงินปลอดภัย! ภาระหนี้อยู่ในเกณฑ์มาตรฐาน (ไม่เกิน 30-40%)"}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-100 text-gray-500 text-sm rounded-2xl border border-gray-200 flex gap-2 items-center">
            <AlertCircle size={18} /> คุณยังไม่ได้ระบุเงินเดือนในหน้า "เป้าหมาย" ระบบจึงไม่สามารถประเมินภาระหนี้ได้
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <button
            onClick={() => { setEditData(null); setIsModalOpen(true); }}
            className="flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-gray-400 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-all min-h-[260px] gap-4 group bg-white/50"
          >
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all duration-300">
              <Plus size={32} className="text-gray-300 group-hover:text-amber-600" />
            </div>
            <div className="text-center">
              <span className="font-black text-lg block">เพิ่มรายการผ่อน</span>
              <span className="text-xs font-medium opacity-60">เช่น บัตรเครดิต, ค่าบ้าน, ค่ารถ</span>
            </div>
          </button>

          {installments.map((item) => {
            const current = item.currentTerm || 0;
            const progress = (current / item.totalTerms) * 100;
            const isFullyPaid = current >= item.totalTerms;

            return (
              <div key={item.id} className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden flex flex-col justify-between min-h-[260px] ${isFullyPaid ? 'bg-gray-50/80 border-gray-200 opacity-80' : 'bg-white border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-100'}`}>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        {item.name}
                        {isFullyPaid && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full uppercase tracking-wider">ผ่อนจบแล้ว</span>}
                      </h3>
                      <div className="text-xs text-gray-400 mt-2 font-bold bg-gray-50 px-2 py-1 rounded-md inline-block border border-gray-100">
                        ยอดเต็ม {Number(item.totalPrice).toLocaleString()} ฿
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-gray-900">{Number(item.monthlyAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">฿ / เดือน</div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex justify-between text-[11px] font-black text-gray-400 mb-3 uppercase tracking-widest">
                      <span>งวดที่ {current} จาก {item.totalTerms}</span>
                      <span className={isFullyPaid ? 'text-emerald-500' : 'text-amber-600'}>
                        {isFullyPaid ? 'สำเร็จ!' : `เหลืออีก ${item.totalTerms - current} เดือน`}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
                      <div
                        style={{ width: `${progress}%` }}
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isFullyPaid ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      เริ่ม: {new Date(item.startDate).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditData(item) || setIsModalOpen(true)} className="p-3 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-2xl transition-all"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={18} /></button>

                      {!isFullyPaid && (
                        <button
                          onClick={() => togglePaid(item)}
                          className="ml-2 flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-lg transform active:scale-95"
                        >
                          จ่ายงวดนี้
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <InstallmentModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditData(null); }}
          onSave={handleSave}
          initialData={editData}
          salary={salary}
          currentTotalMonthly={totalToPay}
        />
      </div>
    </div>
  );
}
