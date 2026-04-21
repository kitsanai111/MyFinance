import React, { useState, useEffect, useMemo } from 'react'; // ✅ เพิ่ม useMemo แล้ว
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Trash2, PlusCircle, LayoutGrid, Edit3, X, Save, Search } from 'lucide-react'; // ✅ เพิ่มไอคอน Search

const AdminCategory = () => {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState("");
    const [type, setType] = useState("expense");
    const [loading, setLoading] = useState(false);

    // ✅ State สำหรับการค้นหา
    const [searchQuery, setSearchQuery] = useState("");

    // ✅ State สำหรับการแก้ไข
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editType, setEditType] = useState("expense");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await api.get('/category');
            setCategories(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    // ✅ ระบบกรองข้อมูล (Search Logic)
    const filteredCategories = useMemo(() => {
        return categories.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.id.toString().includes(searchQuery)
        );
    }, [categories, searchQuery]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return toast.warning("กรุณากรอกชื่อหมวดหมู่");

        setLoading(true);
        try {
            await api.post('/category', {
                name,
                type: type.toLowerCase()
            });
            toast.success("เพิ่มหมวดหมู่สำเร็จ");
            setName("");
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || "บันทึกไม่สำเร็จ";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleEditStart = (item) => {
        setEditId(item.id);
        setEditName(item.name);
        setEditType(item.type);
    };

    const handleEditSave = async () => {
        if (!editName) return toast.warning("กรุณากรอกชื่อหมวดหมู่");
        setLoading(true);
        try {
            await api.put(`/category/${editId}`, {
                name: editName,
                type: editType.toLowerCase()
            });
            toast.success("อัปเดตหมวดหมู่สำเร็จ");
            setEditId(null);
            loadData();
        } catch (err) {
            toast.error("แก้ไขไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm("คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?")) return;
        try {
            await api.delete(`/category/${id}`);
            toast.success("ลบสำเร็จ");
            loadData();
        } catch (err) {
            toast.error("ลบไม่สำเร็จ");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            {/* Header และ Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <LayoutGrid className="text-blue-500" /> จัดการหมวดหมู่รายรับ-รายจ่าย
                </h1>

                {/* ✅ ช่องค้นหาดีไซน์สวยๆ */}
                <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อหรือ ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-600 shadow-sm"
                    />
                </div>
            </div>

            {/* --- Form สำหรับเพิ่มข้อมูล --- */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">เพิ่มหมวดหมู่ใหม่</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="เช่น ค่าอาหาร, เงินเดือน"
                        className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold transition-all"
                    />
                </div>
                <div className="w-40">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ประเภท</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold cursor-pointer transition-all"
                    >
                        <option value="expense">รายจ่าย</option>
                        <option value="income">รายรับ</option>
                    </select>
                </div>
                <button
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black flex items-center gap-2 transition-all disabled:bg-slate-300 shadow-lg shadow-blue-100 active:scale-95"
                >
                    <PlusCircle size={20} /> {loading ? "..." : "เพิ่ม"}
                </button>
            </form>

            {/* --- ตารางแสดงรายการ --- */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-wider w-[10%]">ID</th>
                            <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-wider">ชื่อหมวดหมู่</th>
                            <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-wider">ประเภท</th>
                            <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-wider text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 🚩 เปลี่ยนมาใช้ filteredCategories เพื่อให้ค้นหาได้จริง */}
                        {filteredCategories.map((item) => (
                            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all group">
                                <td className="p-4 text-xs font-black text-slate-300 group-hover:text-blue-500 transition-colors">
                                    #{item.id}
                                </td>
                                <td className="p-4">
                                    {editId === item.id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full p-2 border-2 border-blue-500 rounded-lg outline-none font-bold shadow-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="font-bold text-slate-700">{item.name}</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {editId === item.id ? (
                                        <select
                                            value={editType}
                                            onChange={(e) => setEditType(e.target.value)}
                                            className="p-2 border-2 border-blue-500 rounded-lg outline-none font-bold"
                                        >
                                            <option value="expense">รายจ่าย</option>
                                            <option value="income">รายรับ</option>
                                        </select>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-1">
                                        {editId === item.id ? (
                                            <>
                                                <button onClick={handleEditSave} className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-all">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={() => setEditId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEditStart(item)} className="p-2 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all">
                                                    <Edit3 size={18} />
                                                </button>
                                                <button onClick={() => handleRemove(item.id)} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* ✅ แจ้งเตือนกรณีไม่พบข้อมูล (ทั้งแบบไม่มีเลย และแบบค้นหาไม่เจอ) */}
                {filteredCategories.length === 0 && (
                    <div className="p-16 text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-slate-400 font-bold italic text-sm">
                            {searchQuery ? `ไม่พบหมวดหมู่ที่ตรงกับ "${searchQuery}"` : "ยังไม่มีข้อมูลหมวดหมู่ในระบบ"}
                        </p>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="mt-4 text-blue-500 font-bold text-xs hover:underline">
                                ล้างคำค้นหา
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCategory;