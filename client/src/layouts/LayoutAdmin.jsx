import React from 'react'
import AdminNav from '../components/AdminNav'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../pages/sidebar/AdminSidebar'

const LayoutAdmin = () => {
  return (
    <div className="flex h-screen overflow-hidden"> {/* เปลี่ยนเป็น flex แนวนอน */}
      {/* Sidebar อยู่ฝั่งซ้าย */}
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Nav อยู่ด้านบนของเนื้อหา */}
        <AdminNav />

        {/* เนื้อหาหลัก (Page ต่างๆ) */}
        <main className="p-6 bg-gray-50 min-h-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default LayoutAdmin