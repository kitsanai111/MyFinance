import React from "react";
import { NavLink } from "react-router-dom";
import { Wallet } from "lucide-react"; // 1. นำเข้าไอคอน

const MainNav = () => {
  // Styling Class สำหรับ Link
  const navLinkStyle = ({ isActive }) =>
    `px-5 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
      isActive
        ? "bg-amber-100 text-amber-700 shadow-sm"
        : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
    }`;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-amber-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* --- Logo Section (แก้ใหม่) --- */}
          <NavLink to="/" className="flex items-center gap-3 group">
            
            {/* กล่องไอคอนโลโก้ */}
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Wallet size={22} strokeWidth={2.5} />
            </div>

            {/* ชื่อแบรนด์ */}
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 hidden sm:block">
              MyFinance
            </span>
          </NavLink>

          {/* --- Menu Links --- */}
          <div className="flex items-center gap-2">
            <NavLink to="/contact" className={navLinkStyle}>
              Contact
            </NavLink>
            <NavLink to="/about" className={navLinkStyle}>
              About Me
            </NavLink>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default MainNav;