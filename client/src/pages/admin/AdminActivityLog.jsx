import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Search, Clock, User as UserIcon, Activity, Globe, Download, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const AdminActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/logs');
            setLogs(res.data);
        } catch (err) {
            console.error("Fetch logs error:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log =>
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user?.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [logs, searchQuery]);

    // ฟังก์ชัน Export CSV
    const exportCSV = () => {
        try {
            if (filteredLogs.length === 0) {
                toast.warning("ไม่มีข้อมูลสำหรับส่งออก");
                return;
            }
            const headers = ["เวลา", "ผู้ใช้งาน", "บทบาท", "การกระทำ", "รายละเอียด", "IP Address"];
            const rows = filteredLogs.map(log => [
                new Date(log.createdAt).toLocaleString('th-TH'),
                log.user?.username || '-',
                log.user?.role || '-',
                log.action,
                log.detail || '-',
                log.ipAddress || '-'
            ]);
            const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
            const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "activity_logs.csv");
            link.click();
            toast.success("โหลดไฟล์ CSV สำเร็จ!");
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการส่งออก CSV");
        }
    };

    // ฟังก์ชัน Export PDF
    const exportPDF = () => {
        try {
            if (filteredLogs.length === 0) {
                toast.warning("ไม่มีข้อมูลสำหรับส่งออก");
                return;
            }
            const element = document.getElementById('log-table');
            const opt = {
                margin: 10,
                filename: 'activity_logs.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            toast.info("กำลังสร้างไฟล์ PDF...", { autoClose: 1000 });

            html2pdf().set(opt).from(element).save().then(() => {
                toast.success("โหลดไฟล์ PDF สำเร็จ!");
            });
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์ PDF");
        }
    };
    if (loading) return <div className="p-10 text-center text-slate-400 animate-pulse">กำลังโหลดประวัติการใช้งาน...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4 font-sans">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Activity className="text-amber-500" /> ประวัติการเข้าใช้งาน (Activity Logs)
                </h1>

                <div className="flex items-center gap-2">
                    {/* ปุ่ม Export */}
                    <button onClick={exportCSV} className="p-2.5 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition shadow-sm border border-green-100" title="Export CSV">
                        <Download size={20} />
                    </button>
                    <button onClick={exportPDF} className="p-2.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition shadow-sm border border-red-100" title="Export PDF">
                        <FileText size={20} />
                    </button>

                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อผู้ใช้, การกระทำ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-amber-500 shadow-sm text-sm font-bold"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table id="log-table" className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-wider"><Clock size={14} className="inline mr-1" /> เวลา</th>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-wider"><UserIcon size={14} className="inline mr-1" /> ผู้ใช้งาน</th>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-wider">การกระทำ</th>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-wider">รายละเอียด</th>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-wider"><Globe size={14} className="inline mr-1" /> IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString('th-TH')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-sm">{log.user?.username}</span>
                                            <span className="text-[10px] text-slate-400">{log.user?.role}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider ${log.action === 'LOGIN' ? 'bg-green-100 text-green-600' :
                                            log.action === 'LOGOUT' ? 'bg-slate-100 text-slate-600' :
                                                'bg-amber-100 text-amber-600'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 italic">
                                        {log.detail || '-'}
                                    </td>
                                    <td className="p-4 text-xs font-mono text-slate-400">
                                        {log.ipAddress || 'unknown'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLogs.length === 0 && (
                    <div className="p-20 text-center text-slate-400 italic">
                        ไม่พบข้อมูลการใช้งานในระบบ
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminActivityLog;