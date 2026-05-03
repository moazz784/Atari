import React, { useState, useEffect } from "react";
import { 
  Coffee, CupSoda, ShoppingCart, Trash2, Plus, Minus, 
  Send, Clock, Monitor, Gamepad2, Zap, UtensilsCrossed, 
  X, CheckCircle2
} from "lucide-react";

// بيانات المنيو مع صور وألوان تعبيرية
const menuData = {
  Drinks: [
    { id: 1, name: "Coffee", price: 20, emoji: "☕", color: "#eab308" },
    { id: 2, name: "Tea", price: 15, emoji: "🍵", color: "#10b981" },
    { id: 3, name: "Pepsi", price: 18, emoji: "🥤", color: "#3b82f6" },
    { id: 4, name: "Water", price: 10, emoji: "💧", color: "#0ea5e9" },
    { id: 5, name: "Mirinda", price: 18, emoji: "🍊", color: "#f97316" },
    { id: 6, name: "Red Bull", price: 35, emoji: "⚡", color: "#ef4444" },
  ],
  Snacks: [
    { id: 7, name: "Chips", price: 15, emoji: "🍟", color: "#facc15" },
    { id: 8, name: "Indomie", price: 25, emoji: "🍜", color: "#f87171" },
  ],
  Services: [
    { id: 101, name: "Extra Controller", price: 25, emoji: "🎮", color: "#8b5cf6" },
    { id: 102, name: "Type-C Cable", price: 5, emoji: "🔌", color: "#6366f1" },
  ]
};

export default function CustomerOrderPage() {
  const [activeTab, setActiveTab] = useState("Drinks");
  const [cart, setCart] = useState([]);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeItem = (id) => setCart(cart.filter(i => i.id !== id));
  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <div className="min-h-screen bg-[#020617] text-gray-300 font-sans flex flex-col" dir="rtl">
      
      {/* Header */}
      <header className="p-4 sm:px-8 bg-[#0c0f17] border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Gamepad2 className="text-white" size={24} />
          </div>
          <h1 className="text-white font-black text-xl tracking-tight uppercase">Atari playstation</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
          <InfoBox icon={<Monitor size={18}/>} label="رقم الغرفة" value="ROOM 3" />
          <InfoBox icon={<Clock size={18}/>} label="الوقت الحالي" value={currentTime} />
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        
        {/* الجانب الأيمن: المنتجات */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gradient-to-br from-[#020617] to-[#0c0f17]">
          
          {/* Tabs (MODIFIED ONLY) */}
          <div className="w-full flex justify-center mb-6">
            <div className="flex bg-[#0f172a] p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar gap-1 max-w-full sm:max-w-fit">
              {Object.keys(menuData).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-6 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    activeTab === tab 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab === "Drinks" && <Coffee size={14} />}
                  {tab === "Snacks" && <UtensilsCrossed size={14} />}
                  {tab === "Services" && <Zap size={14} />}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuData[activeTab].map((item) => (
              <div key={item.id} className="bg-[#0f172a] border border-white/5 p-6 rounded-[28px] group hover:border-blue-500/40 transition-all flex flex-col items-center relative overflow-hidden">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                  {item.emoji}
                </div>
                <h3 className="text-white text-sm font-bold mb-1 text-center">{item.name}</h3>
                <p className="text-blue-400 text-xs font-black mb-4">{item.price} EGP</p>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white py-3 rounded-xl transition-all border border-blue-500/20 flex items-center justify-center gap-2 font-bold text-xs"
                >
                  <Plus size={16} /> إضافة للطلب
                </button>
              </div>
            ))}
          </div>
        </main>

        {/* الجانب الأيسر: سلة المشتريات الثابتة */}
        <aside className="w-full lg:w-96 bg-[#0c0f17] border-r border-white/5 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] order-last lg:order-first">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-500" />
              <h2 className="text-white font-bold">طلباتك</h2>
            </div>
            <span className="bg-blue-600/20 text-blue-500 text-[10px] font-black px-2 py-0.5 rounded-lg">
              {cart.length} أصناف
            </span>
          </div>

          {/* CART FIX (small screens scroll limit) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar max-h-[55vh] lg:max-h-none">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <ShoppingCart size={48} className="mb-4" />
                <p className="text-sm font-bold">السلة فارغة</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-[#0f172a]/50 p-4 rounded-2xl border border-white/5 group relative">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="text-white text-xs font-bold">{item.name}</p>
                      <p className="text-blue-500 text-[10px] font-black">{item.price * item.qty} EGP</p>
                    </div>
                    <div className="flex items-center gap-3 bg-[#020617] p-1.5 rounded-xl border border-white/5">
                      <button onClick={() => updateQty(item.id, -1)} className="text-gray-500 hover:text-white"><Minus size={14}/></button>
                      <span className="text-white text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="text-gray-500 hover:text-white"><Plus size={14}/></button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-900/50 hover:text-red-500 pr-2">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Section */}
          <div className="p-6 bg-[#0f172a] border-t border-white/5 space-y-4">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">إجمالي الحساب</p>
                <p className="text-3xl font-black text-white">{totalAmount} <span className="text-xs text-gray-500 uppercase">EGP</span></p>
              </div>
              <CheckCircle2 className="text-[#10b981] mb-1" size={24} />
            </div>
            
            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-[20px] font-bold text-sm shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale" disabled={cart.length === 0}>
              <Send size={18} /> تأكيد الطلب
            </button>
            <p className="text-[9px] text-center text-gray-600 font-medium">سيتم إرسال الطلب فوراً للموظف المسؤول 🎮</p>
          </div>
        </aside>

      </div>
    </div>
  );
}

// مكون صغير للمعلومات في الهيدر
function InfoBox({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-blue-500 opacity-50">{icon}</div>
      <div>
        <p className="text-[9px] text-gray-500 font-bold uppercase leading-none">{label}</p>
        <p className="text-white font-black text-sm tracking-tighter">{value}</p>
      </div>
    </div>
  );
}