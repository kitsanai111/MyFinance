import React from "react";
import { NavLink, useLocation } from "react-router-dom"; // ✅ ใช้ useLocation เช็ก Path
import {
  LayoutDashboard, UserCog, PiggyBank, SquareChartGantt,
  ShoppingBasket, ListOrdered, LogOut, ShieldCheck
} from "lucide-react";

const adminMenus = [
  { to: "/admin", icon: <LayoutDashboard className="mr-2" />, label: "Dashboard", end: true },
  { to: "adminactivityLog", icon: <UserCog className="mr-2" />, label: "ActivityLog" },
  { to: "admincategory", icon: <UserCog className="mr-2" />, label: "Category" },
  { to: "admininvestment", icon: <PiggyBank className="mr-2" />, label: "Investment" },
];

const superAdminMenus = [
  { to: "/superadmin", icon: <ShieldCheck className="mr-2" />, label: "Dashboard", end: true },
  { to: "adminactivityLog", icon: <UserCog className="mr-2" />, label: "ActivityLog" },
  { to: "admincategory", icon: <UserCog className="mr-2" />, label: "Category" },
  { to: "admininvestment", icon: <PiggyBank className="mr-2" />, label: "Investment" },

];

const AdminSidebar = () => {
  const location = useLocation(); // ✅ ดึงข้อมูล URL ปัจจุบัน

  // ✅ 3. Logic เลือกใช้เมนู: ถ้า Path ขึ้นต้นด้วย /superadmin ให้ใช้ชุดใหญ่
  const isSuperAdmin = location.pathname.startsWith('/superadmin');
  const menus = isSuperAdmin ? superAdminMenus : adminMenus;

  const navClass = ({ isActive }) =>
    isActive
      ? "bg-gray-900 rounded-md text-white px-4 py-2 flex items-center transition-all shadow-md"
      : "text-gray-400 px-4 py-2 hover:bg-gray-700 hover:text-white rounded flex items-center transition-all";

  return (
    <div className="bg-gray-800 w-64 text-gray-100 flex flex-col h-screen border-r border-gray-700">
      <div className="h-24 bg-gray-900 flex flex-col items-center justify-center border-b border-gray-800">
        <span className="text-xl font-black tracking-widest text-blue-400">
          {isSuperAdmin ? "SUPER ADMIN" : "ADMIN PANEL"}
        </span>
        <div className="h-1 w-12 bg-blue-500 mt-1 rounded-full"></div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto font-sans">
        {menus.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={navClass}
          >
            {item.icon}
            <span className="font-bold text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 bg-gray-900/50 border-t border-gray-700">
        <button className="w-full text-gray-500 px-4 py-2 hover:bg-red-600 hover:text-white rounded-lg flex items-center transition-all group font-bold">
          <LogOut className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;