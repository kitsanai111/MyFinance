import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { 
  UserCog, 
  LogOut, 
  ChevronDown, 
  LayoutDashboard, 
  Settings, 
  ShieldCheck 
} from "lucide-react"; 
import useEcomStore from '../store/ecom-store';
import api from "../utils/api"; 

const AdminNav = () => {
  const user = useEcomStore((s) => s.user);
  const logout = useEcomStore((s) => s.logout);
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(!isOpen);

  // ✅ ฟังก์ชัน Logout อัปเดตสถานะใน DB
  const handleLogout = async () => {
    try {
      await api.post('/logout'); 
    } catch (err) {
      console.log("Logout status update failed");
    } finally {
      localStorage.clear();
      logout();
      toast.success("ออกจากระบบแล้ว");
      navigate("/", { replace: true });
    }
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 font-sans">
      
      {/* --- ด้านซ้าย: Logo --- */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center text-white">
          <ShieldCheck size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight text-gray-800 leading-none">
            AdminPanel
          </span>
          <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider">
            {user?.role === 'superadmin' ? 'Super Mode' : 'Management'}
          </span>
        </div>
      </div>

      {/* --- ด้านขวา: Admin Profile --- */}
      <div className="flex items-center gap-4">
        
        <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-2 px-2 py-1 rounded-lg border border-transparent hover:border-gray-200 transition-all"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-600 border border-gray-200 font-bold text-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="font-bold text-xs text-gray-800 leading-none">
                {user?.username}
              </span>
              <span className="text-[9px] text-gray-400 font-bold uppercase">
                {user?.role}
              </span>
            </div>
            <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu*/}
          {isOpen && (
            <>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden animate-in fade-in duration-150">
                <div className="p-1">
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Account Settings</div>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Settings size={14} /> ตั้งค่าระบบ
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors font-bold"
                  >
                    <LogOut size={14} /> ออกจากระบบ
                  </button>
                </div>
              </div>
              {/* Overlay สำหรับปิด */}
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;