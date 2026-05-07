import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  Smartphone,
  ArrowRight,
  Bell,
  BarChart3
} from 'lucide-react';

const images = [
  "/image/dashboarduser.jpg",
  "/image/reportuser.jpg",
  "/image/budgetuser.jpg",
  "/image/installmentuser.jpg",
  "/image/goaluser.jpg",
  "/image/deductionuser.jpg",
  "/image/taxuser.jpg"
];



const HomePage = () => {
  const navigate = useNavigate();

  const gradientBg = "bg-gradient-to-r from-amber-500 to-orange-600";
  const gradientText = "bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600";


  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000); // เปลี่ยนทุก 3 วิ

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">

      {/* --- Hero --- */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-amber-100 rounded-full blur-3xl opacity-40"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            เรื่องเงิน เรื่องง่าย <br />
            <span className={gradientText}>
              จัดการได้ในที่เดียว
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            จัดการรายรับรายจ่าย วิเคราะห์พฤติกรรมการเงิน และรับการแจ้งเตือนแบบเรียลไทม์
            ทั้งบนเว็บไซต์และแอปมือถือ
          </p>

          
<div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full px-4">
  
  <button
    onClick={() => navigate('/login')}
    className={`w-full md:w-auto px-8 py-4 ${gradientBg} text-white font-bold rounded-full flex items-center justify-center gap-2 shadow-xl hover:-translate-y-1 transition`}
  >
    เริ่มต้นใช้งาน <ArrowRight size={20} />
  </button>

  <button
    onClick={() => navigate('/register')}
    className="w-full md:w-auto px-8 py-4 border border-gray-200 rounded-full font-semibold hover:bg-gray-50 transition flex items-center justify-center"
  >
    สมัครสมาชิก
  </button>
  
</div>

          {/* Dashboard Mockup */}
          <div className="mt-16 mx-auto max-w-6xl rounded-3xl overflow-hidden shadow-2xl bg-gray-100 p-2">

            {/* ✅ เพิ่ม relative + กำหนด height ให้ wrapper */}
            <div className="relative overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / images.length)}%)`, // ✅ หาร images.length
                  width: `${images.length * 100}%`
                }}
              >
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`slide-${index}`}
                    className="h-64 md:h-[550px] object-cover object-top"
                    style={{ width: `${100 / images.length}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-4">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-orange-500" : "bg-gray-300"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Features --- */}
      <section className="py-20 bg-gray-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">ฟีเจอร์หลักของระบบ</h2>
            <p className="text-gray-500">ทุกอย่างที่คุณต้องใช้ในการจัดการการเงิน</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: "วิเคราะห์การใช้จ่าย", desc: "ดูกราฟและพฤติกรรมการใช้เงินแบบเข้าใจง่าย" },
              { icon: BarChart3, title: "Dashboard อัจฉริยะ", desc: "สรุปข้อมูลการเงินทั้งหมดในหน้าเดียว" },
              { icon: ShieldCheck, title: "ความปลอดภัยสูง", desc: "ข้อมูลถูกเข้ารหัสตามมาตรฐาน" }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition border">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-5">
                  <f.icon />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Mobile App Section (🔥 จุดขายสำคัญ) --- */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">

          <div>
            <h2 className="text-3xl font-bold mb-4">
              ใช้งานได้ทั้งเว็บ และแอปมือถือ
            </h2>

            <p className="text-gray-500 mb-6">
              ไม่ว่าคุณจะอยู่ที่ไหน ก็สามารถบันทึกและติดตามการเงินได้ทันที
              พร้อมการแจ้งเตือนอัจฉริยะบนมือถือ
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="text-amber-500" />
                <span>แจ้งเตือนการใช้เงินแบบ Real-time</span>
              </div>

              <div className="flex items-center gap-3">
                <Smartphone className="text-amber-500" />
                <span>ออกแบบสำหรับมือถือโดยเฉพาะ</span>
              </div>

              <div className="flex items-center gap-3">
                <TrendingUp className="text-amber-500" />
                <span>ติดตามพฤติกรรมการเงินได้ทุกที่</span>
              </div>
            </div>
          </div>

          {/* Phone mock */}
          <div className="bg-gray-100 h-[400px] rounded-3xl flex items-center justify-center text-gray-400">
            Mobile App Preview
          </div>

        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-20 px-6">
        <div className={`${gradientBg} max-w-5xl mx-auto rounded-3xl p-14 text-center text-white shadow-2xl`}>
          <h2 className="text-3xl font-bold mb-4">เริ่มจัดการเงินของคุณวันนี้</h2>
          <p className="mb-8">ใช้ฟรี ไม่มีค่าใช้จ่าย</p>

          <button
            onClick={() => navigate('/register')}
            className="bg-white text-orange-600 px-10 py-4 rounded-full font-bold hover:scale-105 transition"
          >
            สมัครใช้งานฟรี
          </button>
        </div>
      </section>
      {/* --- Download App --- */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">

          {/* TEXT */}
          <div>
            <h2 className="text-3xl font-bold mb-4">
              ดาวน์โหลดแอปพลิเคชัน
            </h2>

            <p className="text-gray-500 mb-6">
              ใช้งานได้ทุกที่ ทุกเวลา รองรับทั้ง iOS และ Android
              บันทึกค่าใช้จ่ายได้ทันทีจากมือถือของคุณ
            </p>

            <div className="flex gap-4 flex-wrap">
              {/* App Store */}
              <button className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition">
                 App Store (Coming Soon)
              </button>

              {/* Google Play */}
              <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition">
                ▶ Google Play (Coming Soon)
              </button>
            </div>
          </div>

          {/* IMAGE / MOCKUP */}
          <div className="bg-white rounded-3xl shadow-xl h-[350px] flex items-center justify-center text-gray-400">
            App Preview
          </div>

        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-10 border-t text-center text-gray-400 text-sm">
        © 2026 FinApp — All rights reserved
      </footer>

    </div>
  );
};

export default HomePage;
