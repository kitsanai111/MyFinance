import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import Register from '../pages/auth/Register'
import Login from '../pages/auth/Login'
import FinanceDashboard from '../pages/user/FinanceDashboard'
import DashboardAdmin from '../pages/admin/DashboardAdmin'
import LayoutsMain from '../layouts/LayoutsMain'
import LayoutUser from '../layouts/LayoutUser'
import ReportPage from '../pages/user/ReportPageUser'
import BudgetUser from '../pages/user/ฺBudgetUser'
import InstallmentUser from '../pages/user/InstallmentUser'
import GoalUser from '../pages/user/GoalUser'
import LayoutAdmin from '../layouts/LayoutAdmin'
import TaxPage from '../pages/user/TaxPage'
import DeductionUser from '../pages/user/DeductionUser'
import DashboardSuperAdmin from '../pages/superadmin/DashboardSuperAdmin'
import AdminCategory from '../pages/admin/AdminCategory'
import AdminInvestment from '../pages/admin/AdminDeduction'
import Formdetail from '../pages/user/Formdetail'
import AdminActivityLog from '../pages/admin/AdminActivityLog'
import ChangePassword from '../pages/auth/ChangePassword'

// ProtectRoute
import ProtectRoute from '../routes/ProtectRoute'

const router = createBrowserRouter([
    {
        path: '/',
        element: <LayoutsMain />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'login', element: <Login /> },
            { path: 'register', element: <Register /> },
            { path: 'changepassword', element: <ChangePassword /> },
        ],
    },
    {
        path: '/user',
        element: (
            <ProtectRoute>
                <LayoutUser />
            </ProtectRoute>
        ),
        children: [
            { path: 'financedashboard', element: <FinanceDashboard /> },
            { path: 'report', element: <ReportPage /> },
            { path: 'budget', element: <BudgetUser /> },
            { path: 'installment', element: <InstallmentUser /> },
            { path: 'goal', element: <GoalUser /> },
            { path: 'tax', element: <TaxPage /> },
            { path: 'deductionuser', element: <DeductionUser /> },
            { path: 'formdetail', element: <Formdetail /> },

        ]
    },
    {
        path: '/admin',
        element: (
            <ProtectRoute>
                <LayoutAdmin />
            </ProtectRoute>
        ),
        children: [
            { index: true, element: <DashboardAdmin /> },
            { path: 'adminactivityLog', element: < AdminActivityLog /> },
            { path: 'admincategory', element: < AdminCategory /> },
            { path: 'Admininvestment', element: < AdminInvestment /> },
        ]
    },
    {
        path: '/superadmin',
        element: (
            <ProtectRoute>
                <LayoutAdmin />
            </ProtectRoute>
        ),
        children: [
            { index: true, element: <DashboardSuperAdmin /> },
            { path: 'adminactivityLog', element: < AdminActivityLog /> },
            { path: 'admincategory', element: < AdminCategory /> },
            { path: 'Admininvestment', element: < AdminInvestment /> },
        ]
    }
])

const AppRoutes = () => {
    return (
        <>
            <RouterProvider router={router} />
        </>
    )
}

export default AppRoutes
