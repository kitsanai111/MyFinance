import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import {
  Menu, X, User, LogOut, ChevronDown, Wallet,
  LayoutDashboard, FileText, PieChart, CreditCard,
  Target, Receipt
} from "lucide-react";

import useEcomStore from '../store/ecom-store';
import api from '../utils/api';

const UserNav = () => {
  const user = useEcomStore((s) => s.user);
  const logout = useEcomStore((s) => s.logout);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate("/user/financedashboard", { replace: true });
    closeDropdown();
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      toast.success("ออกจากระบบสำเร็จ!");
    } catch (err) {
      console.error("Logout API Error:", err);
    } finally {
      localStorage.clear();
      logout();
      navigate("/", { replace: true });
      closeDropdown();
      setIsMobileMenuOpen(false);
    }
  };

  const menuClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg font-bold text-sm transition-all shadow-sm border border-amber-100"
      : "flex items-center gap-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50/50 px-3 py-2 rounded-lg font-medium text-sm transition-all";

  const mobileMenuClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 rounded-xl font-bold shadow-md"
      : "flex items-center gap-3 text-gray-600 hover:bg-amber-50 px-4 py-3 rounded-xl font-medium transition-colors";

  const navItems = [
    { path: "/user/financedashboard", label: "ภาพรวม", icon: LayoutDashboard },
    { path: "/user/report", label: "รายงาน", icon: FileText },
    { path: "/user/budget", label: "งบประมาณ", icon: PieChart },
    { path: "/user/installment", label: "ผ่อนชำระ", icon: CreditCard },
    { path: "/user/goal", label: "เป้าหมาย", icon: Target },
    { path: "/user/deductionuser", label: "ลดหย่อน", icon: Receipt },
    { path: "/user/tax", label: "ภาษี", icon: Receipt },

  ];

  return (
    <nav className="sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm z-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          <div className="flex items-center gap-8">
            {/* Logo */}
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                <Wallet size={20} strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 hidden sm:block">
                MyFinance
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={menuClass}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                >
                  <div className="w-9 h-9 bg-gradient-to-tr from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-amber-700 border border-amber-200 shadow-sm">
                    <User size={18} />
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="font-bold text-sm text-gray-800 leading-none">
                      {user.username}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Member</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <>
                    <div className="absolute right-0 top-full mt-3 w-60 bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Signed in as</p>
                        <p className="font-bold text-gray-900 truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-2">
                        <NavLink to="/user/myprofile" onClick={closeDropdown} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-colors font-medium">
                          <User size={18} /> ข้อมูลส่วนตัว
                        </NavLink>
                        <div className="my-1 border-t border-gray-50"></div>
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium">
                          <LogOut size={18} /> ออกจากระบบ
                        </button>
                      </div>
                    </div>
                    <div className="fixed inset-0 z-30" onClick={closeDropdown}></div>
                  </>
                )}
              </div>
            ) : (
              <NavLink to="/login" className="px-5 py-2 bg-amber-500 text-white rounded-full font-bold shadow hover:bg-amber-600 transition">
                Login
              </NavLink>
            )}

            <div className="lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[80px] bottom-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="bg-white absolute top-0 left-0 right-0 rounded-b-3xl shadow-xl overflow-hidden animate-in slide-in-from-top-5 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileMenuClass}
                >
                  <item.icon size={20} /> {item.label}
                </NavLink>
              ))}

              <div className="my-2 border-t border-gray-100"></div>

              <button onClick={handleLogout} className="flex w-full items-center gap-3 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-3 rounded-xl font-bold transition-colors">
                <LogOut size={20} /> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNav;