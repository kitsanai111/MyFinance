import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import useEcomStore from '../../store/ecom-store';
import {
  Search, Trash2, Clock, FileSearch,
  ShieldAlert, FileText, Table as TableIcon,
  RefreshCw, UserPlus, X, Users, Activity, TrendingUp, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import html2pdf from 'html2pdf.js';

const toThaiDateString = (dateStr) => {
  const date = new Date(dateStr);
  const thaiDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return thaiDate.toISOString().split('T')[0];
};

const toThaiLocaleDateString = (dateStr) => {
  return new Date(dateStr).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const CHART_COLORS = ['#F59E0B', '#6366F1', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6'];

const DashboardSuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
      const [usersRes, logsRes] = await Promise.all([
        api.get(`/users?startDate=${startDate}&endDate=${endDate}`),
        api.get('/logs').catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
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
      toast.success("สร้างผู้ดูแลระบบสำเร็จ");
      setIsModalOpen(false);
      setAdminForm({ username: '', email: '', password: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "ไม่สามารถสร้าง Admin ได้");
    }
  };

  const confirmDelete = (userId, targetRole, username) => {
    if (currentUser.id === userId) return toast.warning("คุณไม่สามารถลบบัญชีตัวเองได้");
    setUserToDelete({ id: userId, role: targetRole, username });
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success(`ลบ ${userToDelete.username} สำเร็จ`);
      loadData();
    } catch { toast.error("ลบข้อมูลไม่สำเร็จ"); }
    finally { setIsDeleteModalOpen(false); setUserToDelete(null); }
  };

  const exportCSV = () => {
    if (filteredUsers.length === 0) return toast.warning("ไม่มีข้อมูล");
    const header = "ID,Username,Role,Status,Created At\n";
    const rows = filteredUsers.map(u =>
      `${u.id},${u.username},${u.role},${u.enabled ? 'Online' : 'Offline'},${toThaiLocaleDateString(u.createdAt)}`
    ).join("\n");
    const blob = new Blob(["\ufeff" + header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `User_Report_${new Date().toLocaleDateString('th-TH')}.csv`;
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
    } catch { toast.error("อัปเดตไม่สำเร็จ"); }
  };

  const newUsersPerDay = (() => {
    const map = {};
    users.forEach(u => {
      const day = toThaiDateString(u.createdAt);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
        จำนวน: count
      }));
  })();

  const roleData = (() => {
    const map = {};
    users.forEach(u => { map[u.role] = (map[u.role] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  })();

  const loginPerDay = (() => {
    const map = {};
    logs.filter(l => l.action === 'LOGIN').forEach(l => {
      const day = toThaiDateString(l.createdAt);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
        Login: count
      }));
  })();

  const onlineData = [
    { name: 'ONLINE', value: users.filter(u => u.enabled).length },
    { name: 'OFFLINE', value: users.filter(u => !u.enabled).length },
  ];

  const filteredUsers = users.filter(user => {
    const matchName = user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!startDate && !endDate) return matchName;
    const userDay = toThaiDateString(user.createdAt);
    const afterStart = startDate ? userDay >= startDate : true;
    const beforeEnd = endDate ? userDay <= endDate : true;
    return matchName && afterStart && beforeEnd;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Dashboard ({currentUser.role?.toUpperCase()})
              </h1>
              <p className="text-xs text-gray-400 mt-1">ข้อมูลแสดงตาม Timezone ไทย (UTC+7)</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-all shadow-sm">
                <UserPlus size={16} /> เพิ่ม Admin
              </button>
              <button onClick={loadData}
                className="p-2 bg-white border border-gray-200 text-gray-400 rounded-lg hover:text-amber-500 transition-colors">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-6 pt-6 border-t border-dashed border-gray-200">
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              <TableIcon size={16} /> ส่งออก CSV
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              <FileText size={16} /> ส่งออก PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'ผู้ใช้ทั้งหมด', value: users.length, icon: <Users size={20} />, color: 'text-amber-500 bg-amber-50' },
            { label: 'Online ขณะนี้', value: users.filter(u => u.enabled).length, icon: <Activity size={20} />, color: 'text-green-500 bg-green-50' },
            { label: 'Admin', value: users.filter(u => u.role !== 'user').length, icon: <UserPlus size={20} />, color: 'text-indigo-500 bg-indigo-50' },
            { label: 'Login วันนี้', value: logs.filter(l => l.action === 'LOGIN' && toThaiDateString(l.createdAt) === toThaiDateString(new Date())).length, icon: <TrendingUp size={20} />, color: 'text-blue-500 bg-blue-50' },
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-2xl font-black text-gray-800">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <UserPlus size={16} className="text-amber-500" /> User ใหม่รายวัน (7 วันล่าสุด)
            </h2>
            {newUsersPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={newUsersPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="จำนวน" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm text-center py-10">ไม่มีข้อมูล</p>}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <PieChart size={16} className="text-indigo-500" /> สัดส่วน Role
            </h2>
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {roleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm text-center py-10">ไม่มีข้อมูล</p>}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" /> การ Login รายวัน (7 วันล่าสุด)
            </h2>
            {loginPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={loginPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Login" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm text-center py-10">ไม่มีข้อมูล</p>}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-green-500" /> สถานะ User
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie data={onlineData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="ค้นหาชื่อผู้ใช้..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 text-sm" />
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none text-gray-600" />
            <span>-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none text-gray-600" />
          </div>
        </div>

        {/* Table */}
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
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {toThaiLocaleDateString(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded ${item.role === 'superadmin' ? 'text-amber-700 bg-amber-50' : 'text-gray-600 bg-gray-100'}`}>
                      {item.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleToggleStatus(item.id, item.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${item.enabled ? 'bg-amber-500' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-300">
                      <button className="hover:text-amber-500 transition-colors"><FileSearch size={18} /></button>
                      <button onClick={() => confirmDelete(item.id, item.role, item.username)}
                        className="hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Admin */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 relative animate-in zoom-in-95">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus className="text-amber-500" size={20} /> เพิ่ม Admin ใหม่
              </h2>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                {['username', 'email', 'password'].map(field => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                    <input type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} required
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 text-sm"
                      value={adminForm[field]} onChange={e => setAdminForm({ ...adminForm, [field]: e.target.value })} />
                  </div>
                ))}
                <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-xl hover:bg-amber-600 transition-all active:scale-95">
                  ยืนยันการเพิ่ม
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Delete */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                <ShieldAlert className="text-red-500" size={20} /> ยืนยันการลบ
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                คุณกำลังจะลบผู้ใช้งาน <span className="font-bold text-gray-900">"{userToDelete?.username}"</span> ระดับสิทธิ์ <span className="font-bold text-gray-900">{userToDelete?.role?.toUpperCase()}</span> ออกจากระบบถาวร การดำเนินการนี้ไม่สามารถย้อนคืนได้
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                  ยกเลิก
                </button>
                <button onClick={executeDelete}
                  className="px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all active:scale-95">
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