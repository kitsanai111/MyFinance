import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { PiggyBank, Trash2, Edit3, Save, X, Search, CheckCircle2, Circle } from 'lucide-react';

const AdminDeduction = () => {
    const [funds, setFunds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const CATEGORIES = [
        { id: 'family', name: 'ส่วนตัวและครอบครัว' },
        { id: 'insurance', name: 'ประกันชีวิต' },
        { id: 'investment', name: 'การลงทุนเพื่อลดหย่อน' },
        { id: 'discountfund', name: 'กองทุนลดหย่อน' },
        { id: 'donation', name: 'เงินบริจาค' },
        { id: 'stimulus', name: 'กระตุ้นเศรษฐกิจและที่อยู่อาศัย' }
    ];
    const PRESETS_BY_CATEGORY = {
        family: [
            { code: 'PERSONAL', name: 'ค่าลดหย่อนส่วนตัว', limit: 60000, isCount: false, isFixed: true },
            { code: 'SPOUSE', name: 'ค่าลดหย่อนคู่สมรส (ไม่มีรายได้)', limit: 60000, isCount: true, isFixed: false },
            { code: 'CHILD_BIO_1', name: 'บุตรชอบด้วยกฎหมาย (คนแรก/เกิดก่อนปี 61)', limit: 30000, isCount: true, isFixed: false },
            { code: 'CHILD_BIO_261', name: 'บุตรคนที่ 2 ขึ้นไป (เกิดปี 61 เป็นต้นไป)', limit: 60000, isCount: true, isFixed: false },
            { code: 'CHILD_ADOPT', name: 'บุตรบุญธรรม', limit: 30000, isCount: true, isFixed: false },
            { code: 'PARENT_SELF', name: 'อุปการะบิดามารดาตนเอง(อายุมากกว่า 60 ปี และมีรายได้ต่อปีไม่เกิน 30,000 บาท)', limit: 30000, isCount: true, isFixed: false },
            { code: 'PARENT_SPOUSE', name: 'อุปการะบิดามารดาคู่สมรส(อายุมากกว่า 60 ปี และมีรายได้ต่อปีไม่เกิน 30,000 บาท)', limit: 30000, isCount: true, isFixed: false },
            { code: 'DISABLED_CARE', name: 'อุปการะผู้พิการ/ทุพพลภาพ(ผู้พิการจะต้องมีรายได้ไม่เกิน 30,000 บาทต่อปี และมีบัตรประจำตัวผู้พิการ)', limit: 60000, isCount: true, isFixed: false },
            { code: 'MATERNITY', name: 'ค่าฝากครรภ์และคลอดบุตร(ลดหย่อนได้ตามที่จ่ายจริง รวมสูงสุดไม่เกินครรภ์ละ 60,000 บาท)', limit: 60000, isCount: false, isFixed: false },
        ],
        insurance: [
            { code: 'SOCIAL_SEC', name: 'ประกันสังคม', limit: 9000, isCount: false },
            { code: 'LIFE_INS', name: 'ประกันชีวิต/สะสมทรัพย์', limit: 100000, isCount: false },
            { code: 'HEALTH_INS', name: 'ประกันสุขภาพตนเอง', limit: 25000, isCount: false },
            { code: 'PARENT_HEALTH', name: 'ประกันสุขภาพพ่อแม่', limit: 15000, isCount: false },
        ],
        investment: [
            { code: 'SOCIAL_ENT', name: 'เงินลงทุนวิสาหกิจเพื่อสังคม (Social Enterprise)', limit: 100000, incomeLimitRate: 0, isCount: false },
            { code: 'THAI_ESG', name: 'กองทุน Thai ESG (30% ไม่เกิน 3 แสน)', limit: 300000, incomeLimitRate: 30, isCount: false },
            { code: 'THAI_ESGX', name: 'กองทุน Thai ESGX (สับเปลี่ยน LTF)', limit: 300000, incomeLimitRate: 0, isCount: false },
        ],
        discountfund: [
            { code: 'RMF', name: 'กองทุน RMF (30% ไม่เกิน 5 แสน)', limit: 500000, incomeLimitRate: 30, isCount: false },
            { code: 'SSF', name: 'กองทุน SSF (30% ไม่เกิน 2 แสน)', limit: 200000, incomeLimitRate: 30, isCount: false }, // เผื่อไว้สำหรับปีที่ยังมีสิทธิ
            { code: 'PVD', name: 'กองทุนสำรองเลี้ยงชีพ (PVD/ครูเอกชน)', limit: 500000, incomeLimitRate: 15, isCount: false },
            { code: 'GPF', name: 'กองทุน กบข. (30% ไม่เกิน 5 แสน)', limit: 500000, incomeLimitRate: 30, isCount: false },
            { code: 'NSF', name: 'กองทุนการออมแห่งชาติ (กอช.)', limit: 30000, incomeLimitRate: 0, isCount: false },
            { code: 'PENSION_INS', name: 'ประกันชีวิตแบบบำนาญ (15% ไม่เกิน 2 แสน)', limit: 200000, incomeLimitRate: 15, isCount: false },
        ],
        donation: [
            { code: 'DONATE_GENERAL', name: 'เงินบริจาคทั่วไป(สูงสุดไม่เกิน 10% ของเงินได้หลังจากหักค่าลดหย่อนภาษี)', limit: 0, incomeLimitRate: 10, isCount: false },
            { code: 'DONATE_DOUBLE', name: 'เงินบริจาคเพื่อการศึกษา/กีฬา/พยาบาล (2 เท่า สูงสุดไม่เกิน 10% ของเงินได้หลังจากหักค่าลดหย่อนภาษี)', limit: 0, incomeLimitRate: 10, isCount: false },
            { code: 'DONATE_POLITICAL', name: 'เงินบริจาคพรรคการเมือง(ไม่เกิน 10,000 บาท)', limit: 10000, incomeLimitRate: 0, isCount: false },
        ],
        stimulus: [
            { code: 'E_RECEIPT', name: 'Easy e-Receipt 2568 (ไม่เกิน 50,000 บาท ตามที่จ่ายจริง)', limit: 50000, isCount: false },
            { code: 'SOLAR_CELL', name: 'ติดตั้งโซล่าร์เซลล์ที่อยู่อาศัย (ไม่เกิน 200,000 บาท ตามที่จ่ายจริง)', limit: 200000, isCount: false },
            { code: 'HOME_LOAN_INT', name: 'ดอกเบี้ยกู้ยืมที่อยู่อาศัย (ลดหย่อนได้ตามที่จ่ายจริง สูงสุดไม่เกิน 100,000 บาท)', limit: 100000, isCount: false },
            { code: 'HOME_CONSTRUCT', name: 'ค่าสร้างบ้านใหม่ 2567-2568 (ลดหย่อนได้ 10,000 บาท ต่อจำนวนค่าก่อสร้างที่จ่ายจริงทุก 1 ล้านบาท (รวม VAT แล้ว) รวมแล้วไม่เกิน 100,000 บาท)', limit: 100000, isCount: false },
        ]
    };
    // ✅ เพิ่ม hasDividend เข้าไปใน State ฟอร์ม
    const [form, setForm] = useState({
        code: "", name: "", taxLimit: "", category: "investment",
        isFixed: false, isCount: false, expectedReturn: "",
        incomeLimitRate: "", hasDividend: false
    });

    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "", taxLimit: "", category: "investment",
        isFixed: false, isCount: false, expectedReturn: "",
        incomeLimitRate: "", hasDividend: false
    });

    useEffect(() => { loadFunds(); }, []);

    const loadFunds = async () => {
        try {
            const res = await api.get('/fund-types');
            setFunds(res.data);
        } catch (err) { console.error(err); }
    };

    const filteredFunds = funds.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.code || !form.taxLimit) return toast.warning("กรุณากรอกข้อมูลให้ครบ");
        setLoading(true);
        try {
            await api.post('/fund-types', {
                ...form,
                taxLimit: Number(form.taxLimit),
                expectedReturn: Number(form.expectedReturn || 0),
                incomeLimitRate: Number(form.incomeLimitRate || 0)
            });
            toast.success("เพิ่มสำเร็จ");
            setForm({ code: "", name: "", taxLimit: "", category: "investment", isFixed: false, isCount: false, expectedReturn: "", incomeLimitRate: "", hasDividend: false });
            loadFunds();
        } catch (err) { toast.error("เพิ่มไม่สำเร็จ"); }
        finally { setLoading(false); }
    };

    const handleEditStart = (fund) => {
        setEditId(fund.id);
        setEditForm({ ...fund });
    };

    const handleUpdate = async () => {
        try {
            await api.put(`/fund-types/${editId}`, {
                ...editForm,
                taxLimit: Number(editForm.taxLimit),
                expectedReturn: Number(editForm.expectedReturn || 0),
                incomeLimitRate: Number(editForm.incomeLimitRate || 0)
            });
            toast.success("อัปเดตสำเร็จ");
            setEditId(null);
            loadFunds();
        } catch (err) { toast.error("อัปเดตไม่สำเร็จ"); }
    };

    // ✅ ฟังก์ชันCheckbox 
    const handleEditCheckbox = (field) => {
        setEditForm({
            ...editForm,
            [field]: !editForm[field] // สลับค่า true/false ใน editForm
        });
    };

    const handleDelete = (id, name) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบรายการ "${name}"?`)) {
            api.delete(`/fund-types/${id}`)
                .then(() => {
                    toast.success("ลบรายการสำเร็จ");
                    loadFunds();
                })
                .catch(() => toast.error("ลบไม่สำเร็จ"));
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 space-y-6 text-slate-800 font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <PiggyBank className="text-blue-600" /> ตั้งค่าลดหย่อน (Master Data)
                </h1>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อรายการ หรือ Code..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-blue-400 text-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            {/* Form เพิ่มข้อมูล */}
            <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
                {/* เลือกกลุ่มลดหย่อน */}
                <div className="w-44">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">กลุ่มลดหย่อน</label>
                    <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value, code: "", name: "", taxLimit: "", incomeLimitRate: "" })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm"
                    >
                        {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>

                {/* ส่วนเลือกรายการมาตรฐาน หรือ กรอกเอง */}
                <div className="flex-1 flex gap-4">
                    {PRESETS_BY_CATEGORY[form.category] ? (
                        <div className="w-full">
                            <label className="text-[10px] font-black uppercase text-blue-600 mb-1 block">
                                เลือกรายการมาตรฐาน ({CATEGORIES.find(c => c.id === form.category)?.name})
                            </label>
                            <select
                                onChange={(e) => {
                                    const selectedCode = e.target.value;
                                    const preset = PRESETS_BY_CATEGORY[form.category]?.find(p => p.code === selectedCode);
                                    if (preset) {
                                        setForm({
                                            ...form,
                                            code: preset.code,
                                            name: preset.name,
                                            taxLimit: preset.limit,
                                            incomeLimitRate: preset.incomeLimitRate || 0,
                                            isCount: preset.isCount || false,
                                            isFixed: preset.isFixed || false
                                        });
                                    }
                                }}
                                className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg font-bold text-sm"
                                value={form.code}
                            >
                                <option value="">-- เลือกประเภท ({form.category}) --</option>
                                {PRESETS_BY_CATEGORY[form.category]?.map(p => (
                                    <option key={p.code} value={p.code}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <>
                            <div className="w-32">
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">CODE</label>
                                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full p-2 border border-slate-200 rounded-lg font-bold uppercase" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">ชื่อรายการ</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg font-bold" />
                            </div>
                        </>
                    )}
                </div>

                {/* ข้อมูลตัวเลข */}
                <div className="w-24">
                    <label className="text-[10px] font-black uppercase text-purple-600 mb-1 block">สิทธิ์ % เงินได้</label>
                    <input type="number" value={form.incomeLimitRate} onChange={(e) => setForm({ ...form, incomeLimitRate: e.target.value })} className="w-full p-2 border border-purple-100 rounded-lg font-bold text-purple-600" />
                </div>
                <div className="w-32">
                    <label className="text-[10px] font-black uppercase text-blue-600 mb-1 block">เพดาน (฿)</label>
                    <input type="number" value={form.taxLimit} onChange={(e) => setForm({ ...form, taxLimit: e.target.value })} className="w-full p-2 border border-blue-100 rounded-lg font-bold text-blue-600" />
                </div>

                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md">
                    เพิ่มรายการ
                </button>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                        <tr>
                            <th className="p-4 w-[8%]">Code</th>
                            <th className="p-4 w-[12%] text-center">ประเภท</th>
                            <th className="p-4 w-[18%]">ชื่อรายการ</th>
                            <th className="p-4 w-[8%] text-center text-emerald-600">กำไร %</th>
                            <th className="p-4 w-[8%] text-center text-purple-600">สิทธิ์ %</th>
                            <th className="p-4 w-[10%] text-center text-blue-600">เพดาน ฿</th>
                            <th className="p-4 w-[6%] text-center">ล็อค</th>
                            <th className="p-4 w-[6%] text-center">คน</th>
                            <th className="p-4 w-[6%] text-center text-emerald-600">ปันผล</th>
                            <th className="p-4 w-[12%] text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredFunds.map((fund) => {
                            const isEditing = editId === fund.id;
                            return (
                                <tr key={fund.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black">{fund.code}</span></td>
                                    <td className="p-4 text-center">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                            {CATEGORIES.find(c => c.id === fund.category)?.name}
                                        </span>
                                    </td>

                                    {/* ชื่อรายการ */}
                                    <td className="p-4 font-bold text-sm">
                                        {isEditing ?
                                            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="border border-blue-300 p-1 w-full rounded outline-none" />
                                            : fund.name
                                        }
                                    </td>

                                    {/* กำไร % */}
                                    <td className="p-4 text-center font-black text-emerald-600">
                                        {isEditing ?
                                            <input type="number" value={editForm.expectedReturn} onChange={(e) => setEditForm({ ...editForm, expectedReturn: e.target.value })} className="w-16 border border-blue-300 rounded text-center outline-none" />
                                            : `${fund.expectedReturn}%`
                                        }
                                    </td>

                                    {/* สิทธิ์ % */}
                                    <td className="p-4 text-center font-black text-purple-600">
                                        {isEditing ?
                                            <input type="number" value={editForm.incomeLimitRate} onChange={(e) => setEditForm({ ...editForm, incomeLimitRate: e.target.value })} className="w-16 border border-blue-300 rounded text-center outline-none" />
                                            : `${fund.incomeLimitRate}%`
                                        }
                                    </td>

                                    {/* เพดาน ฿ */}
                                    <td className="p-4 text-center font-black text-blue-600">
                                        {isEditing ?
                                            <input type="number" value={editForm.taxLimit} onChange={(e) => setEditForm({ ...editForm, taxLimit: e.target.value })} className="w-24 border border-blue-300 rounded text-center outline-none" />
                                            : `฿${Number(fund.taxLimit).toLocaleString()}`
                                        }
                                    </td>

                                    {/* ✅ Checkbox: ล็อค (isFixed) */}
                                    <td className="p-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isEditing ? editForm.isFixed : fund.isFixed}
                                            disabled={!isEditing} // 🚩 ห้ามติ๊กถ้าไม่ได้อยู่ในโหมด Edit
                                            onChange={() => handleEditCheckbox('isFixed')}
                                            className={`w-4 h-4 ${isEditing ? 'accent-blue-600 cursor-pointer' : 'accent-slate-300 cursor-not-allowed opacity-50'}`}
                                        />
                                    </td>

                                    {/* ✅ Checkbox: คน (isCount) */}
                                    <td className="p-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isEditing ? editForm.isCount : fund.isCount}
                                            disabled={!isEditing} // 🚩 ห้ามติ๊กถ้าไม่ได้อยู่ในโหมด Edit
                                            onChange={() => handleEditCheckbox('isCount')}
                                            className={`w-4 h-4 ${isEditing ? 'accent-blue-600 cursor-pointer' : 'accent-slate-300 cursor-not-allowed opacity-50'}`}
                                        />
                                    </td>

                                    {/* ✅ Checkbox: ปันผล (hasDividend) */}
                                    <td className="p-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isEditing ? editForm.hasDividend : fund.hasDividend}
                                            disabled={!isEditing} // 🚩 ห้ามติ๊กถ้าไม่ได้อยู่ในโหมด Edit
                                            onChange={() => handleEditCheckbox('hasDividend')}
                                            className={`w-4 h-4 ${isEditing ? 'accent-emerald-500 cursor-pointer' : 'accent-slate-300 cursor-not-allowed opacity-50'}`}
                                        />
                                    </td>

                                    {/* ปุ่มจัดการ */}
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleUpdate} className="text-emerald-500 hover:scale-110 transition-transform"><Save size={18} /></button>
                                                    <button onClick={() => setEditId(null)} className="text-red-400 hover:scale-110 transition-transform"><X size={18} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEditStart(fund)} className="text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
                                                    <button onClick={() => handleDelete(fund.id, fund.name)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDeduction;