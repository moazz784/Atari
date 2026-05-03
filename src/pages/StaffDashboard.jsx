import React, { useState, useEffect } from "react";
import { 
  Play, Square, Monitor, Package, LayoutDashboard, 
  Plus, Minus, Check, X, Receipt, ShoppingCart, Clock, History, ChevronDown
} from "lucide-react";

// تعريف الأسعار هنا لسهولة التعديل
const RATES = {
  single: 20, // سعر السنجل
  multi: 40   // سعر المالتي
};

export default function CyberProSystem() {
  const [view, setView] = useState("dashboard");
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null); // للتحكم في قائمة اختيار النوع

  // حالة الغرف مع إضافة خاصية النوع المختار والسعر
  const [rooms, setRooms] = useState([
    { id: 1, name: "ROOM 1", status: "idle", startTime: null, elapsed: 0, roomOrders: [], isCheckingOut: false, selectedMode: 'single', currentRate: RATES.single },
    { id: 2, name: "ROOM 2", status: "idle", startTime: null, elapsed: 0, roomOrders: [], isCheckingOut: false, selectedMode: 'single', currentRate: RATES.single },
    { id: 3, name: "ROOM 3", status: "idle", startTime: null, elapsed: 0, roomOrders: [], isCheckingOut: false, selectedMode: 'single', currentRate: RATES.single },
  ]);

  const [pendingOrders, setPendingOrders] = useState([
    { id: 101, roomName: "ROOM 2", itemName: "بيبسي", price: 18, time: "10:30 PM" },
    { id: 102, roomName: "ROOM 1", itemName: "قهوة سادة", price: 20, time: "10:35 PM" },
  ]);

  const [inventory, setInventory] = useState([
    { id: 1, name: "قهوة سادة", price: 20, stock: 50 },
    { id: 2, name: "ريد بُل", price: 35, stock: 4 },
    { id: 3, name: "بيبسي", price: 18, stock: 24 },
  ]);

  const [totalRevenue, setTotalRevenue] = useState(1250);
  const [revenueHistory, setRevenueHistory] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRooms(prev => prev.map(r => 
        r.status === "active" && !r.isCheckingOut
          ? { ...r, elapsed: Math.floor((Date.now() - r.startTime) / 1000) } 
          : r
      ));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // إغلاق القائمة المنسدلة عند الضغط في أي مكان
  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  const addNewRoom = () => {
    if (newRoomName.trim() === "") return;
    const newRoom = {
      id: Date.now(),
      name: newRoomName.toUpperCase(),
      status: "idle",
      startTime: null,
      elapsed: 0,
      roomOrders: [],
      isCheckingOut: false,
      selectedMode: 'single',
      currentRate: RATES.single
    };
    setRooms([...rooms, newRoom]);
    setNewRoomName("");
    setShowAddRoomModal(false);
  };

  const startRoom = (id) => {
    setRooms(rooms.map(r => 
      r.id === id ? { ...r, status: "active", startTime: Date.now(), elapsed: 0, roomOrders: [], isCheckingOut: false } : r
    ));
  };

  // وظيفة تغيير النوع (سنجل/مالتي) قبل البدء
  const changeMode = (id, mode) => {
    setRooms(rooms.map(r => 
      r.id === id ? { ...r, selectedMode: mode, currentRate: RATES[mode] } : r
    ));
    setActiveDropdown(null);
  };

  const confirmPayment = (id, finalAmount) => {
    const room = rooms.find(r => r.id === id);
    const newTransaction = {
      id: Date.now(),
      roomName: room.name,
      amount: finalAmount,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setRevenueHistory([newTransaction, ...revenueHistory]);
    setTotalRevenue(prev => prev + finalAmount);
    setRooms(rooms.map(r => 
      r.id === id ? { ...r, status: "idle", startTime: null, elapsed: 0, roomOrders: [], isCheckingOut: false, selectedMode: 'single', currentRate: RATES.single } : r
    ));
  };

  const acceptOrder = (orderId) => {
    const order = pendingOrders.find(o => o.id === orderId);
    setRooms(rooms.map(r => r.name === order.roomName ? { ...r, roomOrders: [...r.roomOrders, { name: order.itemName, price: order.price }] } : r));
    setInventory(inventory.map(item => item.name === order.itemName ? { ...item, stock: Math.max(0, item.stock - 1) } : item));
    setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-gray-300 flex flex-col md:flex-row font-sans" dir="rtl">
      
      {/* Sidebar - الجزء اليمين (لم يتم لمسه) */}
      <aside className="w-full md:w-72 bg-[#0c0f17] border-l border-white/5 p-6 flex flex-col gap-4 text-right">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-900/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <h2 className="text-white font-black text-xl tracking-tight">إدارة السايبر</h2>
        </div>
        
        <nav className="space-y-3">
          <MenuBtn active={view === "dashboard"} icon={<Monitor size={20}/>} label="لوحة الأجهزة" onClick={() => setView("dashboard")} />
          <MenuBtn active={view === "orders"} icon={<ShoppingCart size={20}/>} label="الطلبات المعلقة" badge={pendingOrders.length} onClick={() => setView("orders")} />
          <MenuBtn active={view === "inventory"} icon={<Package size={20}/>} label="إدارة المخزن" onClick={() => setView("inventory")} />
          <MenuBtn active={view === "history"} icon={<History size={20}/>} label="سجل الإيرادات" onClick={() => setView("history")} />
        </nav>

        <button onClick={() => setShowAddRoomModal(true)} className="mt-4 flex items-center justify-center gap-3 w-full py-4 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-[1.5rem] font-black hover:bg-blue-600 hover:text-white transition-all group">
          <Plus size={20} className="group-hover:rotate-90 transition-transform"/>
          إضافة غرفة جديدة
        </button>

        <div className="mt-auto bg-gradient-to-br from-blue-600/20 to-transparent p-5 rounded-[2rem] border border-blue-500/20">
          <p className="text-[11px] text-blue-400 font-black uppercase mb-1">دخل وردية اليوم</p>
          <p className="text-2xl font-black text-white">{totalRevenue} <span className="text-xs text-blue-500">EGP</span></p>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-6 md:p-10 relative">
        
        {showAddRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0c0f17] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl text-right">
              <h3 className="text-xl font-black text-white mb-6">إضافة غرفة جديدة</h3>
              <input 
                autoFocus type="text" placeholder="اسم الغرفة" value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white mb-6 focus:border-blue-600 outline-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowAddRoomModal(false)} className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold">إلغاء</button>
                <button onClick={addNewRoom} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">حفظ الغرفة</button>
              </div>
            </div>
          </div>
        )}

        {/* شاشة الأجهزة (التعديل هنا) */}
        {view === "dashboard" && (
          <div className="animate-in fade-in duration-500">
            <header className="mb-10 text-right">
              <h1 className="text-3xl font-black text-white mb-2">إدارة الأجهزة</h1>
              <p className="text-gray-500">اختر النوع وابدأ الوقت</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-right">
              {rooms.map(room => {
                const timeCost = Math.ceil((room.elapsed / 3600) * room.currentRate);
                const ordersCost = room.roomOrders.reduce((sum, item) => sum + item.price, 0);
                const totalCost = timeCost + ordersCost;

                return (
                  <div key={room.id} className={`group relative p-8 rounded-[3rem] border-2 transition-all duration-500 ${room.status === 'active' ? 'bg-[#0f172a] border-blue-600/50 shadow-2xl shadow-blue-900/20' : 'bg-[#0c0f17] border-white/5 hover:border-white/10'}`}>
                    
                    {room.isCheckingOut ? (
                      <div className="space-y-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <h4 className="text-blue-400 font-black flex items-center gap-2"><Receipt size={20}/> الفاتورة</h4>
                          <X className="cursor-pointer text-gray-600" onClick={() => setRooms(rooms.map(r => r.id === room.id ? {...r, isCheckingOut: false} : r))} />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs text-gray-400"><span>النوع المستهلك:</span><span>{room.selectedMode === 'multi' ? 'مالتي' : 'سنجل'}</span></div>
                          <div className="flex justify-between"><span>الوقت ({formatTime(room.elapsed)})</span><span className="text-white font-bold">{timeCost} EGP</span></div>
                          <div className="flex justify-between"><span>المشروبات</span><span className="text-white font-bold">{ordersCost} EGP</span></div>
                          <div className="pt-4 border-t border-white/5 flex justify-between text-2xl font-black"><span>الإجمالي</span><span className="text-green-500">{totalCost} EGP</span></div>
                        </div>
                        <button onClick={() => confirmPayment(room.id, totalCost)} className="w-full py-5 bg-green-600 text-white rounded-[1.5rem] font-black active:scale-95 transition-transform">تحصيل المبلغ</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h3 className="text-2xl font-black text-white">{room.name}</h3>
                            {/* إظهار النوع المختار في البوكس الكبير */}
                            <p className={`text-[11px] font-black uppercase mt-1 px-3 py-1 rounded-full w-fit ${room.status === 'active' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                              {room.selectedMode === 'multi' ? 'وضع مالتي (40)' : 'وضع سنجل (20)'}
                            </p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${room.status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-800'}`}></div>
                        </div>

                        <div className="bg-black/40 py-8 rounded-[2.5rem] text-center border border-white/5 mb-8">
                          <span className={`text-5xl font-mono font-black tracking-tighter ${room.status === 'active' ? 'text-white' : 'text-gray-800'}`}>
                            {formatTime(room.elapsed)}
                          </span>
                        </div>

                        {room.status === 'active' ? (
                          <button 
                            onClick={() => setRooms(rooms.map(r => r.id === room.id ? {...r, isCheckingOut: true} : r))}
                            className="w-full py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 bg-white/5 text-white hover:bg-red-600 transition-all"
                          >
                            <Square size={18} fill="currentColor"/> إنهاء الوقت
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            {/* زر اختيار النوع */}
                            <div className="relative">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === room.id ? null : room.id); }}
                                className="h-full px-4 rounded-[1.2rem] bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center"
                              >
                                <ChevronDown size={20} className={`transition-transform ${activeDropdown === room.id ? 'rotate-180' : ''}`} />
                              </button>

                              {activeDropdown === room.id && (
                                <div className="absolute bottom-full right-0 mb-3 w-40 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                  <button onClick={() => changeMode(room.id, 'single')} className="w-full px-4 py-3 text-right text-sm hover:bg-white/5 text-white font-bold flex items-center gap-2 border-b border-white/5">
                                    <div className={`w-2 h-2 rounded-full ${room.selectedMode === 'single' ? 'bg-blue-500' : 'bg-gray-600'}`}></div> سنجل
                                  </button>
                                  <button onClick={() => changeMode(room.id, 'multi')} className="w-full px-4 py-3 text-right text-sm hover:bg-white/5 text-white font-bold flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${room.selectedMode === 'multi' ? 'bg-purple-500' : 'bg-gray-600'}`}></div> مالتي
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* زر البدء الأساسي */}
                            <button 
                              onClick={() => startRoom(room.id)}
                              className={`flex-1 py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 text-white ${room.selectedMode === 'multi' ? 'bg-purple-600 shadow-purple-900/30' : 'bg-blue-600 shadow-blue-900/30'}`}
                            >
                              <Play size={18} fill="currentColor"/> Start
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* شاشات الطلبات والمخزن والسجل (لم يتم لمسها) */}
        {view === "history" && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500 text-right">
            <header className="mb-10">
              <h1 className="text-3xl font-black text-white mb-2">سجل الإيرادات</h1>
            </header>
            <div className="bg-[#0c0f17] rounded-[2.5rem] border border-white/5 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-white/5 text-blue-400"><tr className="font-black"><th className="p-6">الوقت</th><th className="p-6">الغرفة</th><th className="p-6">المبلغ</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {revenueHistory.length === 0 ? (<tr><td colSpan="3" className="p-10 text-center text-gray-600 font-bold">لا توجد عمليات مسجلة</td></tr>) : 
                    revenueHistory.map(item => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-6 font-mono text-gray-500">{item.time}</td>
                        <td className="p-6 font-black text-white">{item.roomName}</td>
                        <td className="p-6 font-black text-green-500">{item.amount} EGP</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "orders" && (
          <div className="max-w-4xl mx-auto animate-in duration-500 text-right text-white font-black">
            <h1 className="text-3xl mb-10">الطلبات المعلقة</h1>
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-[#0c0f17] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between mb-4">
                <div className="flex items-center gap-6">
                  <div className="bg-blue-600/10 text-blue-500 p-4 rounded-2xl">{order.roomName}</div>
                  <div><h4>{order.itemName}</h4><p className="text-sm text-gray-500">{order.price} EGP</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPendingOrders(prev => prev.filter(o => o.id !== order.id))} className="p-4 bg-red-600/10 text-red-500 rounded-2xl"><X/></button>
                  <button onClick={() => acceptOrder(order.id)} className="p-4 bg-green-600 text-white rounded-2xl flex gap-2"><Check/> قبول</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "inventory" && (
          <div className="max-w-4xl mx-auto animate-in duration-500 text-right">
            <h1 className="text-3xl text-white font-black mb-10">المخزن</h1>
            {inventory.map(item => (
              <div key={item.id} className="bg-[#0c0f17] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between mb-4">
                <div><h4 className="text-white font-bold">{item.name}</h4><p className="text-blue-500">{item.price} EGP</p></div>
                <div className="flex items-center gap-6">
                  <span className="text-white font-black text-xl">{item.stock}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setInventory(inventory.map(i => i.id === item.id ? {...i, stock: Math.max(0, i.stock-1)} : i))} className="p-2 bg-white/5 rounded-lg text-gray-400"><Minus size={16}/></button>
                    <button onClick={() => setInventory(inventory.map(i => i.id === item.id ? {...i, stock: i.stock+1} : i))} className="p-2 bg-white/5 rounded-lg text-gray-400"><Plus size={16}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// مكون زر القائمة الجانبية
function MenuBtn({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-5 py-4 rounded-[1.5rem] font-bold text-sm transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-gray-500 hover:bg-white/5'}`}>
      <div className="flex items-center gap-4">{icon} {label}</div>
      {badge > 0 && <span className="bg-red-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center animate-bounce">{badge}</span>}
    </button>
  );
}