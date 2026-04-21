import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import useEcomStore from '../../store/ecom-store';
import {
  Search, Trash2, Clock, FileSearch,
  ShieldAlert, ShieldCheck, UserCheck,
  FileText, Table as TableIcon, RefreshCw, UserPlus, X
} from 'lucide-react';

import html2pdf from 'html2pdf.js';


const DashboardSuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ State สำหรับ Modal เพิ่ม Admin และ Modal ยืนยันการลบ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [adminForm, setAdminForm] = useState({ username: '', email: '', password: '' });

  const currentUser = useEcomStore((state) => state.user);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/users?startDate=${startDate}&endDate=${endDate}`);
      setUsers(res.data);
    } catch (err) {
      toast.error("ดึงข้อมูลไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/create-admin', adminForm);
      toast.success(`สร้างผู้ดูแลระบบสำเร็จ`);
      setIsModalOpen(false);
      setAdminForm({ username: '', email: '', password: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "ไม่สามารถสร้าง Admin ได้");
    }
  };

  // ✅ 1. ฟังก์ชันเปิดป๊อปอัพยืนยันการลบ (เก็บชื่อ Username)
  const confirmDelete = (userId, targetRole, username) => {
    if (currentUser.id === userId) return toast.warning("คุณไม่สามารถลบบัญชีตัวเองได้");

    setUserToDelete({ id: userId, role: targetRole, username: username });
    setIsDeleteModalOpen(true);
  };

  // ✅ 2. ฟังก์ชันลบจริง
  const executeDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success(`ลบ ${userToDelete.username} สำเร็จ`);
      loadData();
    } catch (err) {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const exportCSV = () => {
    if (filteredUsers.length === 0) return toast.warning("ไม่มีข้อมูล");
    const header = "ID,Username,Role,Status,Created At\n";
    const rows = filteredUsers.map(u => `${u.id},${u.username},${u.role},${u.enabled ? 'Online' : 'Offline'},${u.createdAt}`).join("\n");
    const blob = new Blob(["\ufeff" + header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `User_Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
    toast.success("ส่งออก CSV สำเร็จ");
  };

  const exportPDF = () => {
    const element = document.getElementById('user-table');
    const opt = {
      margin: 10,
      filename: 'User_Report.pdf',
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    toast.info("กำลังสร้าง PDF...");
    html2pdf().set(opt).from(element).save().then(() => toast.success("ส่งออก PDF สำเร็จ"));
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.post('/change-status', { id: userId, enabled: !currentStatus });
      toast.success("อัปเดตสำเร็จ");
      loadData();
    } catch (err) { toast.error("อัปเดตไม่สำเร็จ"); }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                Dashboard ({currentUser.role?.toUpperCase()})
              </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-all shadow-sm"
              >
                <UserPlus size={16} /> เพิ่ม Admin
              </button>
              <button onClick={loadData} className="p-2 bg-white border border-gray-200 text-gray-400 rounded-lg hover:text-amber-500 transition-colors">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-6 pt-6 border-t border-dashed border-gray-200">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              <TableIcon size={16} /> ส่งออก CSV
            </button>
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              <FileText size={16} /> ส่งออก PDF
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text" placeholder="ค้นหาชื่อผู้ใช้..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none text-gray-600" />
            <span>-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none text-gray-600" />
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table id="user-table" className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[11px] uppercase font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4 text-center">Role</th>
                <th className="px-6 py-4 text-center">Access</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.enabled ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                        {item.enabled ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${item.role === 'superadmin' ? 'bg-amber-600' : item.role === 'admin' ? 'bg-orange-500' : 'bg-gray-400'}`}>
                        {item.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-700">{item.username}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} /> {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded ${item.role === 'superadmin' ? 'text-amber-700 bg-amber-50' : 'text-gray-600 bg-gray-100'}`}>
                      {item.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(item.id, item.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${item.enabled ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-300">
                      <button className="hover:text-amber-500 transition-colors"><FileSearch size={18} /></button>
                      {/* ✅ ปุ่มลบ: เรียกใช้ confirmDelete พร้อมส่ง Username */}
                      <button
                        onClick={() => confirmDelete(item.id, item.role, item.username)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Modal: Add Admin --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 relative animate-in zoom-in-95">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold">
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus className="text-amber-500" size={20} /> เพิ่ม Admin ใหม่
              </h2>
              <form onSubmit={handleCreateAdmin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Username</label>
                  <input type="text" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 transition-all text-sm"
                    value={adminForm.username} onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                  <input type="email" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 transition-all text-sm"
                    value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
                  <input type="password" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 transition-all text-sm"
                    value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
                </div>
                <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-xl mt-2 hover:bg-amber-600 transition-all active:scale-95">
                  ยืนยันการเพิ่ม
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ✅ 3. Simple Delete Confirmation Modal (ขาว-ส้ม) */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={20} /> ยืนยันการลบ
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                คุณกำลังจะลบผู้ใช้งาน <span className="font-bold text-gray-900">"{userToDelete?.username}"</span> ระดับสิทธิ์ <span className="font-bold text-gray-900">{userToDelete?.role?.toUpperCase()}</span> ออกจากระบบถาวร การดำเนินการนี้ไม่สามารถย้อนคืนได้
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={executeDelete}
                  className="px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm shadow-red-100 transition-all active:scale-95"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardSuperAdmin;