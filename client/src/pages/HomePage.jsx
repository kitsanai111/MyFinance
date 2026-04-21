import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  TrendingUp, 
  Smartphone, 
  ArrowRight,
  Menu
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const gradientBg = "bg-gradient-to-r from-amber-500 to-orange-600";
  const gradientText = "bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600";

  const handleLoginRedirect = () => {
    navigate('/login'); 
  };
  const handleRegisterRedirect = () =>{
    navigate('/register')
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* --- Hero Section --- */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            เรื่องเงิน เรื่องง่าย <br className="hidden md:block" />
            <span className={gradientText}>
              จัดการได้ในที่เดียว
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            ควบคุมรายรับ-รายจ่าย วางแผนการออม และวิเคราะห์พฤติกรรมการใช้เงินของคุณด้วย AI อัจฉริยะ เริ่มต้นสร้างวินัยทางการเงินที่ดีตั้งแต่วันนี้
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            {/* 3. เพิ่ม onClick ที่ปุ่มนี้ */}
            <button 
              onClick={handleLoginRedirect}
              className={`px-8 py-4 ${gradientBg} text-white font-bold rounded-full hover:opacity-95 transition flex items-center gap-2 shadow-xl shadow-amber-600/20 transform hover:-translate-y-1`}
            >
              เริ่มต้นใช้งานฟรี <ArrowRight size={20} />
            </button>
            
          </div>

          {/* Mockup Image Placeholder */}
          <div className="mt-16 mx-auto max-w-5xl rounded-2xl overflow-hidden shadow-2xl shadow-amber-100 border border-gray-200 bg-gray-50">
             <div className="h-64 md:h-[500px] flex items-center justify-center bg-gray-100 text-gray-400">
                <p>วางรูปหน้า Dashboard (ธีมสีเหลือง) ตรงนี้</p>
             </div>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">ทำไมต้องเลือก FinApp?</h2>
            <p className="text-gray-500">เรามีเครื่องมือครบครันที่จะช่วยให้คุณเป็นนายของเงินตัวเอง</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: TrendingUp, 
                title: "วิเคราะห์การใช้จ่าย", 
                desc: "เห็นภาพรวมการเงินด้วยกราฟที่เข้าใจง่าย รู้ทันทีว่าเงินหมดไปกับอะไร" 
              },
              { 
                icon: ShieldCheck, 
                title: "ความปลอดภัยสูง", 
                desc: "ข้อมูลของคุณถูกเข้ารหัสด้วยมาตรฐานระดับธนาคาร มั่นใจได้ 100%" 
              },
              { 
                icon: Smartphone, 
                title: "ใช้งานได้ทุกที่", 
                desc: "รองรับทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์ ข้อมูลซิงค์กันแบบ Real-time" 
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group">
                <div className={`w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 mb-6 group-hover:${gradientBg} group-hover:text-white transition-all duration-300`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Call to Action --- */}
      <section className="py-20 px-6">
        <div className={`max-w-5xl mx-auto ${gradientBg} rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-amber-600/30`}>
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500 opacity-20 rounded-full blur-2xl translate-x-1/2 translate-y-1/2"></div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">พร้อมที่จะเปลี่ยนชีวิตทางการเงินหรือยัง?</h2>
          <p className="text-amber-50 mb-10 text-lg relative z-10">สมัครสมาชิกวันนี้ ใช้งานฟีเจอร์พื้นฐานฟรีตลอดชีพ ไม่ต้องผูกบัตรเครดิต</p>
          
          {/* 3.1 เพิ่ม onClick ที่ปุ่มด้านล่างด้วย */}
          <button 
            onClick={handleRegisterRedirect}
            className="bg-white text-orange-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition shadow-lg relative z-10 transform hover:scale-105 duration-200"
          >
            เปิดบัญชีฟรีทันที
          </button>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-white py-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© 2025 FinApp. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-amber-600 transition">Privacy Policy</a>
            <a href="#" className="hover:text-amber-600 transition">Terms of Service</a>
            <a href="#" className="hover:text-amber-600 transition">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;