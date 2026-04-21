import React, { useState } from 'react';
// import axios from 'axios'; // ไม่ได้ใช้ในหน้านี้โดยตรง ลบออกได้ถ้าใช้ store แล้ว
import { toast } from 'react-toastify';
import useEcomStore from '../../store/ecom-store';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Wallet } from 'lucide-react'; // นำเข้าไอคอน

const Login = () => {
  const navigate = useNavigate();
  const actionLogin = useEcomStore((state) => state.actionLogin);
  
  // State สำหรับ Form
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  
  // State สำหรับ UX (Loading & Show Password)
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleOnChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // เริ่มโหลด

    try {
      const res = await actionLogin(form);
      localStorage.setItem('token', res.data.token);
      
      const role = res.data.payload.role;
      roleRedirect(role);

      toast.success("ยินดีต้อนรับกลับเข้าสู่ระบบ!");
    } catch (err) {
      console.log(err);
      const errMsg = err.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่";
      toast.error(errMsg);
    } finally {
      setIsLoading(false); // จบการโหลด (ไม่ว่าจะสำเร็จหรือล้มเหลว)
    }
  };

const roleRedirect = (role) => {
    if (role === "superadmin") {
      navigate("/superadmin", { replace: true });
    } else if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/user/financedashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-amber-50 p-4">
      
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 relative overflow-hidden">
        {/* Decoration Circle (วงกลมตกแต่งจางๆ) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-50 -translate-y-10 translate-x-10"></div>

        {/* --- Header Section --- */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white shadow-lg mb-4 transform rotate-3">
            <Wallet size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 mt-2 text-sm">กรอกข้อมูลเพื่อเข้าใช้งานบัญชีของคุณ</p>
        </div>

        {/* --- Form Section --- */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                onChange={handleOnChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"} // สลับ type input
                name="password"
                onChange={handleOnChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
              {/* ปุ่ม Show/Hide Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
             <div className="flex justify-end mt-1">
                <a href="changepassword" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                  ลืมรหัสผ่าน?
                </a>
             </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading} // ปิดปุ่มเมื่อกำลังโหลด
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:opacity-95 hover:shadow-lg hover:shadow-amber-500/30 transition-all transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        {/* --- Footer Section --- */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center relative z-10">
          <p className="text-sm text-gray-500">
            ยังไม่มีบัญชีใช่ไหม?{' '}
            <Link to="/register" className="text-amber-600 font-bold hover:text-orange-700 hover:underline">
              สมัครสมาชิกฟรี
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;