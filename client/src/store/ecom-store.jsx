import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { BASE_API_URL } from "../config";

const ecomStore = (set) => ({
  user: null,
  token: null,

  logout: () => {
    set({
      user: null,
      token: null,
    });
    
    localStorage.removeItem("ecom-store"); 
  },

  actionLogin: async (form) => {
    const LOGIN_ENDPOINT = `${BASE_API_URL}/login`;

    const res = await axios.post(LOGIN_ENDPOINT, form);

    set({
      user: res.data.payload,
      token: res.data.token,
    });

    return res;
  },
});

const useEcomStore = create(
  persist(ecomStore, {
    name: "ecom-store", 
    storage: createJSONStorage(() => localStorage),
  })
);

export default useEcomStore;