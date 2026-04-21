import React from 'react'
import { Outlet } from 'react-router-dom'
import MainNav from '../components/MainNav'

const LayoutsMain = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <main className="flex-1 p-4 bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}

export default LayoutsMain
