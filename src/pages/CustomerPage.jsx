import React, { useState, useEffect } from "react";
import { 
  Coffee, ShoppingCart, Plus, Minus, 
  Send, Clock, Monitor, Gamepad2, Zap, UtensilsCrossed, 
  X, CheckCircle2
} from "lucide-react";
import { api, guestTokenFromUrl, menuToTabs } from "../api";

export default function CustomerOrderPage() {
  const [activeTab, setActiveTab] = useState("");
  const [cart, setCart] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [menuData, setMenuData] = useState({});
  const [roomName, setRoomName] = useState("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState("");

  const token = guestTokenFromUrl();

  // ===== الوقت الحالي =====
  useEffect(() => {
    const tick = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // ===== جلب المنيو من الـ API =====
  useEffect(() => {
    if (!token) {
      setError("رابط QR غير صالح");
      setLoading(false);
      return;
    }

    let cancelled = false;
    api.qrMenu(token)
      .then((menu) => {
        if (cancelled) return;
        const tabs = menuToTabs(menu);
        setMenuData(tabs);
        const first = Object.keys(tabs)[0];
        setActiveTab(first || "");
        if (menu?.room?.name) setRoomName(menu.room.name);
        else if (menu?.roomName) setRoomName(menu.roomName);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "فشل تحميل المنيو");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token]);

  // ===== إظهار toast مؤقت =====
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ===== إضافة للسلة =====
  const addToCart = (item) => {
    if (item.stock !== undefined && item.stock !== null && item.stock <= 0) {
      showToast("هذا المنتج غير متوفر حالياً");
      return;
    }

    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      const max = item.stock ?? Infinity;
      if (existing.qty + 1 > max) {
        showToast(`الحد الأقصى المتاح: ${max}`);
        return;
      }
      setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next = Math.max(1, i.qty + delta);
      const max = i.stock ?? Infinity;
      return { ...i, qty: Math.min(next, max) };
    }));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  // ===== إرسال الطلب =====
  const confirmOrder = async () => {
    if (!cart.length || sending) return;
    setSending(true);
    try {
      await api.placeOrder(token, cart.map(i => ({ productId: i.id, qty: i.qty })));
      setCart([]);
      setSent(true);
      showToast("تم إرسال طلبك بنجاح ✅");
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      showToast(err.message || "فشل إرسال الطلب");
    } finally {
      setSending(false);
    }
  };

  // ===== شاشة تحميل =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-gray-300 flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500">جاري تحميل المنيو...</p>
        </div>
      </div>
    );
  }

  // ===== شاشة خطأ =====
  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] text-gray-300 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-[#0f172a] border border-red-500/20 rounded-[28px] p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-white font-black text-lg mb-2">تعذّر تحميل المنيو</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-gray-300 font-sans flex flex-col" dir="rtl">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-[#0f172a] border border-blue-500/30 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="p-4 sm:px-8 bg-[#0c0f17] border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Gamepad2 className="text-white" size={24} />
          </div>
          <h1 className="text-white font-black text-xl tracking-tight uppercase">Atari playstation</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
          <InfoBox icon={<Monitor size={18}/>} label="رقم الغرفة" value={roomName} />
          <InfoBox icon={<Clock size={18}/>} label="الوقت الحالي" value={currentTime} />
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        
        {/* الجانب الأيمن: المنتجات */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gradient-to-br from-[#020617] to-[#0c0f17]">
          
          {/* Tabs */}
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
                  {tab.toLowerCase().includes("drink") && <Coffee size={14} />}
                  {tab.toLowerCase().includes("snack") && <UtensilsCrossed size={14} />}
                  {tab.toLowerCase().includes("service") && <Zap size={14} />}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Products */}
          {(menuData[activeTab] || []).length === 0 ? (
            <div className="text-center py-20 text-gray-600 font-bold">
              لا توجد منتجات في هذا التصنيف
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(menuData[activeTab] || []).map((item) => {
                const outOfStock = item.stock !== undefined && item.stock !== null && item.stock <= 0;
                return (
                  <div 
                    key={item.id} 
                    className={`bg-[#0f172a] border border-white/5 p-6 rounded-[28px] group hover:border-blue-500/40 transition-all flex flex-col items-center relative overflow-hidden ${outOfStock ? 'opacity-50' : ''}`}
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                      {item.emoji || "🍽️"}
                    </div>
                    <h3 className="text-white text-sm font-bold mb-1 text-center">{item.name}</h3>
                    <p className="text-blue-400 text-xs font-black mb-4">{item.price} EGP</p>
                    <button 
                      onClick={() => addToCart(item)}
                      disabled={outOfStock}
                      className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white py-3 rounded-xl transition-all border border-blue-500/20 flex items-center justify-center gap-2 font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600/10 disabled:hover:text-blue-500"
                    >
                      <Plus size={16} /> {outOfStock ? "غير متوفر" : "إضافة للطلب"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* الجانب الأيسر: سلة المشتريات */}
        <aside className="w-full lg:w-96 bg-[#0c0f17] border-r border-white/5 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] order-last lg:order-first">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-500" />
              <h2 className="text-white font-bold">طلباتك</h2>
            </div>
            <span className="bg-blue-600/20 text-blue-500 text-[10px] font-black px-2 py-0.5 rounded-lg">
              {totalItems} عنصر
            </span>
          </div>

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
                    <span className="text-2xl">{item.emoji || "🍽️"}</span>
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

          {/* Checkout */}
          <div className="p-6 bg-[#0f172a] border-t border-white/5 space-y-4">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">إجمالي الحساب</p>
                <p className="text-3xl font-black text-white">{totalAmount} <span className="text-xs text-gray-500 uppercase">EGP</span></p>
              </div>
              <CheckCircle2 className={sent ? "text-[#10b981]" : "text-[#10b981]"} size={24} />
            </div>
            
            <button 
              onClick={confirmOrder}
              disabled={cart.length === 0 || sending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-[20px] font-bold text-sm shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              <Send size={18} /> 
              {sending ? "جاري الإرسال..." : sent ? "تم الإرسال ✅" : "تأكيد الطلب"}
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