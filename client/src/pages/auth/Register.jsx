import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import zxcvbn from "zxcvbn";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, Loader2, Wallet, CheckCircle } from "lucide-react"; // นำเข้าไอคอน
import api from '../../utils/api';



// --- Zod Schema ---
const registerSchema = z
  .object({
    username: z.string().min(3, "Username ต้องมากกว่า 3 ตัวอักษร"),
    email: z.string().email({ message: "รูปแบบ Email ไม่ถูกต้อง" }),
    password: z.string().min(8, { message: "Password ต้องมากกว่า 8 ตัวอักษร" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

const Register = () => {
  const navigate = useNavigate();
  const [passwordScore, setPasswordScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // State สำหรับเปิด/ปิดดูรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  // Watch Password for Strength Meter
  const passwordValue = watch("password");
  
  useEffect(() => {
    if (passwordValue) {
      const score = zxcvbn(passwordValue).score;
      setPasswordScore(score);
    } else {
      setPasswordScore(0);
    }
  }, [passwordValue]);

  const onSubmit = async (data) => {
    setIsLoading(true); // เริ่มโหลด
    try {
      const res = await api.post("/register", data);
      toast.success(res.data);
    
      navigate("/login"); // ส่งไปหน้า Login แทน Home เพื่อให้ Login ใหม่
    } catch (err) {
      const errMsg = err.response?.data?.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก";
      toast.error(errMsg);
    } finally {
      setIsLoading(false); // จบการโหลด
    }
  };

  // Helper สำหรับสีและข้อความของ Password Strength
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-amber-50 p-4">
      
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 relative overflow-hidden border border-white/50">
         {/* Decoration */}
         <div className="absolute top-0 left-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl opacity-30 -translate-y-10 -translate-x-10"></div>

        {/* --- Header --- */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg mb-3 transform -rotate-3 hover:rotate-0 transition-transform">
            <Wallet size={28} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-500 text-sm mt-1">สมัครสมาชิกเพื่อเริ่มต้นใช้งาน</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">

          {/* Username */}
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register("username")}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all bg-gray-50 focus:bg-white ${errors.username ? 'border-red-500 focus:ring-red-200' : 'border-gray-200'}`}
                type="text"
                placeholder="Username"
              />
            </div>
            {errors.username && <p className="text-red-500 text-xs ml-1">{errors.username.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register("email")}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all bg-gray-50 focus:bg-white ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200'}`}
                type="email"
                placeholder="Email Address"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register("password")}
                className={`w-full pl-10 pr-12 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all bg-gray-50 focus:bg-white ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-200'}`}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password.message}</p>}

            {/* Password Strength Bar */}
            {passwordValue && (
               <div className="mt-2">
                 <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500">ความปลอดภัย: </span>
                    <span className={`text-xs font-bold ${strengthColors[passwordScore].replace('bg-', 'text-')}`}>
                       {strengthLabels[passwordScore]}
                    </span>
                 </div>
                 <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ease-out ${strengthColors[passwordScore]}`}
                        style={{ width: `${(passwordScore + 1) * 20}%` }}
                    ></div>
                 </div>
               </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CheckCircle className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register("confirmPassword")}
                className={`w-full pl-10 pr-12 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all bg-gray-50 focus:bg-white ${errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-200'}`}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-amber-500/30 hover:opacity-95 transition-all transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Sign Up"}
          </button>

        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-sm text-gray-500 relative z-10">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-amber-600 font-bold hover:text-orange-700 hover:underline">
             เข้าสู่ระบบ
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;