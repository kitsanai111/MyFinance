import React, { useEffect, useState } from 'react';
import { User, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function MyProfile() {
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.post('/current-user') 
           .then(res => setProfile(res.data.user))
           .catch(err => console.error(err));
    }, []);

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center animate-pulse text-gray-400 font-bold">
            กำลังโหลดข้อมูล...
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-xl mx-auto">
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="mb-6 flex items-center gap-2 text-gray-400 hover:text-gray-800 transition-colors font-bold text-sm"
                >
                    <ArrowLeft size={18} /> ย้อนกลับ
                </button>

                <h1 className="text-3xl font-black text-gray-900 mb-8">โปรไฟล์ส่วนตัว</h1>
                
                {/* Profile Card */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header Decorative Area */}
                    <div className="h-32 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
                    
                    <div className="px-8 pb-8 -mt-12">
                        {/* Avatar */}
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 border-4 border-white">
                            <span className="text-4xl font-black text-amber-500">
                                {profile.username[0].toUpperCase()}
                            </span>
                        </div>

                        {/* Info List */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400"><User size={20} /></div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ชื่อผู้ใช้งาน</label>
                                    <div className="font-bold text-gray-800">{profile.username}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400"><Mail size={20} /></div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">อีเมล</label>
                                    <div className="font-bold text-gray-800">{profile.email}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400"><ShieldCheck size={20} /></div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">บทบาท (Role)</label>
                                    <div className="font-black text-amber-600 uppercase text-sm">{profile.role}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}