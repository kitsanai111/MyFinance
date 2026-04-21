import React, { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes'; 
import { ToastContainer } from 'react-toastify';
import useEcomStore from './store/ecom-store'; 

const App = () => {
  const token = useEcomStore(state => state.token);
  const actionCheckCurrentUser = useEcomStore(state => state.actionCheckCurrentUser);

  useEffect(() => {
    if (token && actionCheckCurrentUser) {
      console.log("Token found. Running Current User Check...");
      actionCheckCurrentUser();
    }
  }, [token, actionCheckCurrentUser]); // ทำงานเมื่อ token ถูกโหลด

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <AppRoutes />
    </>
  );
};

export default App;