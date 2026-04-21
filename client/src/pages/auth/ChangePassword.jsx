// client/src/pages/user/ChangePassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// ✅ ลบอันเก่าทิ้ง แล้วใช้แค่อันนี้อันเดียวพอครับ
import { Lock, Eye, EyeOff, Loader2, KeyRound, ShieldCheck, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "", // ✅ เพิ่มฟิลด์ Email
    newPassword: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleOnChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
    }

    setIsLoading(true);
    try {
      // ✅ ส่งทั้ง email และ newPassword ไปที่ API ตัวใหม่
      await api.post('/forgot-password', {
        email: form.email,
        newPassword: form.newPassword
      });

      toast.success("เปลี่ยนรหัสผ่านสำเร็จ! ลองเข้าสู่ระบบดูนะ");
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-amber-50 p-4">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 relative overflow-hidden border border-gray-100">

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white shadow-lg mb-4 transform rotate-3">
            <KeyRound size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Forgot Password</h2>
          <p className="text-gray-500 mt-2 text-sm">ระบุอีเมลเพื่อตั้งรหัสผ่านใหม่</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* --- ช่อง Email (เพิ่มเข้ามาเพื่อให้ Server รู้ตัวตน) --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleOnChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="กรอกอีเมลที่ใช้สมัคร"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ShieldCheck className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                onChange={handleOnChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="ตั้งรหัสผ่านใหม่"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Confirm New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ShieldCheck className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleOnChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-95 disabled:opacity-70">
            {isLoading ? "กำลังประมวลผล..." : "ตั้งรหัสผ่านใหม่"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center relative z-10">
          <Link to="/login" className="text-amber-600 font-bold hover:underline">ย้อนกลับไปหน้าเข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;