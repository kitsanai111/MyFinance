import React, { useEffect } from 'react';
import useEcomStore from '../store/ecom-store';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProtectRoute = ({ children }) => {
  const token = useEcomStore((state) => state.token);
  const user = useEcomStore((state) => state.user);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token || !user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนใช้งาน', { autoClose: 2000 });
      navigate('/', { replace: true });
      return;
    }

    if (location.pathname.startsWith('/admin')) {
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ');
        navigate('/user/home', { replace: true });
      }
    }
  }, [token, user, navigate, location]);

  if (!token || !user) return null;

  if (location.pathname.startsWith('/admin')) {
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return null;
    }
  }

  return children;
};

export default ProtectRoute;