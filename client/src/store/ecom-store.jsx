import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { BASE_API_URL } from "../config";

const ecomStore = (set) => ({
  user: null,
  token: null,

  // ✅ แก้ไข: ลบข้อมูลออกจาก LocalStorage ด้วย
  logout: () => {
    set({
      user: null,
      token: null,
    });
    
    // สั่งลบ Key ออกจาก Browser ทันที
    localStorage.removeItem("ecom-store"); 
  },

  actionLogin: async (form) => {
    const LOGIN_ENDPOINT = `${BASE_API_URL}/login`;

    const res = await axios.post(LOGIN_ENDPOINT, form);

    // backend ส่ง payload + token
    set({
      user: res.data.payload,
      token: res.data.token,
    });

    return res;
  },
});

const useEcomStore = create(
  persist(ecomStore, {
    name: "ecom-store", // ชื่อ key ที่อยู่ใน localStorage
    storage: createJSONStorage(() => localStorage),
  })
);

export default useEcomStore;