import React from "react";
import UserNav from "../components/UserNav"; // Navbar แบบ user
import UserSidebar from "../pages/sidebar/AdminSidebar";
import { Outlet } from "react-router-dom";

const LayoutUser = () => {
  return (
      <div className="min-h-screen flex flex-col">
        <UserNav />
        <main className="flex-1 p-4 bg-gray-50">
          <Outlet />
        </main>
      </div>
  );
};

export default LayoutUser;
