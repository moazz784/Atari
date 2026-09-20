import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Square, Monitor, Package, LayoutDashboard, 
  Plus, Minus, Check, X, Receipt, ShoppingCart, Clock, History, ChevronDown,
  LogOut, QrCode
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  api, toStaffRoom, connectOrdersHub, getToken, getUser 
} from "../api";
import QrCardModal from "../QrCardModal";

export default function CyberProSystem() {
  const navigate = useNavigate();
  const user = getUser();
  const [branchId, setBranchId] = useState(user?.branchId ?? null);

  const [view, setView] = useState("dashboard");
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rates, setRates] = useState({ single: 0, multi: 0 });
  const [qrRoom, setQrRoom] = useState(null);
  const ratesRef = useRef(rates);
  ratesRef.current = rates;

  useEffect(() => {
    if (user?.branchId) {
      setBranchId(user.branchId);
      return;
    }
    let cancelled = false;
    api.branches()
      .then((list) => {
        if (cancelled) return;
        const first = Array.isArray(list) ? list[0] : null;
        if (!first?.id) {
          setError("لا يوجد فرع مرتبط بهذا الحساب");
          setLoading(false);
          return;
        }
        setBranchId(first.id);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "فشل تحميل الفروع");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [user?.branchId]);

  // ===== 1. تحميل البيانات الأولية من الـ API =====
  useEffect(() => {
    if (branchId == null) return;
    let cancelled = false;

    async function boot() {
      try {
        const [roomsData, pending, products, txs, stgs] = await Promise.all([
          api.rooms(branchId),
          api.pendingOrders(branchId).catch(() => []),
          api.products(branchId).catch(() => []),
          api.transactions(branchId).catch(() => []),
          api.settings(branchId).catch(() => null),
        ]);

        if (cancelled) return;

        const nextRates = {
          single: Number(stgs?.singleHourlyRate) || 0,
          multi: Number(stgs?.multiHourlyRate) || 0,
        };
        setRates(nextRates);
        setRooms((roomsData || []).map((room) => withIdleRate(toStaffRoom(room), nextRates)));
        setPendingOrders(normalizePending(pending));
        setInventory(normalizeProducts(products));
        const history = normalizeTransactions(txs);
        setRevenueHistory(history);
        setTotalRevenue(history.reduce((sum, t) => sum + (t.amount || 0), 0));
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "فشل تحميل البيانات");
          setLoading(false);
        }
      }
    }

    boot();
    return () => { cancelled = true; };
  }, [branchId]);

  // ===== 2. SignalR للتحديثات اللحظية =====
  useEffect(() => {
    if (!getToken()) return;
    let conn;

    connectOrdersHub({
      onOrderCreated: (payload) => {
        const order = payload?.staffPending || payload?.admin;
        if (order) setPendingOrders(prev => [normalizePendingOrder(order), ...prev]);
      },
      onOrderUpdated: (order) => {
        setPendingOrders(prev => prev.filter(o => o.id !== order.id));
      },
      onRoomUpdated: (room) => {
        setRooms(prev => {
          const mapped = withIdleRate(toStaffRoom(room), ratesRef.current);
          const exists = prev.find(r => r.id === mapped.id);
          return exists
            ? prev.map(r => r.id === mapped.id ? { ...mapped, isCheckingOut: r.isCheckingOut } : r)
            : [...prev, mapped];
        });
      },
      onSessionEnded: ({ roomId }) => {
        setRooms(prev => prev.map(r => 
          r.id === roomId 
            ? { ...r, status: "idle", startTime: null, elapsed: 0, roomOrders: [], isCheckingOut: false, selectedMode: 'single', currentRate: ratesRef.current.single }
            : r
        ));
      },
    }).then(c => { conn = c; }).catch(console.error);

    return () => { conn?.stop(); };
  }, []);

  // ===== 3. Timer للـ countdown =====
  useEffect(() => {
    const timer = setInterval(() => {
      setRooms(prev => prev.map(r => {
        if (r.status !== "active" || r.isCheckingOut) return r;
        const start = startTimeMs(r.startTime);
        if (!start) return r;
        return { ...r, elapsed: Math.max(0, Math.floor((Date.now() - start) / 1000)) };
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // إغلاق القائمة المنسدلة
  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  // ===== 4. إضافة غرفة جديدة =====
  const addNewRoom = async () => {
    if (newRoomName.trim() === "") return;
    try {
      const created = await api.createRoom(newRoomName.toUpperCase(), branchId);
      const mapped = withIdleRate(toStaffRoom(created), ratesRef.current);
      setRooms(prev => [...prev, mapped]);
      setNewRoomName("");
      setShowAddRoomModal(false);
      setQrRoom(mapped);
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== 5. بدء الغرفة =====
  const startRoom = async (id, mode = "single") => {
    try {
      const updated = await api.startRoom(id, mode);
      setRooms(prev => prev.map(r => 
        r.id === id ? toStaffRoom(updated) : r
      ));
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== 6. تغيير النوع =====
  const changeMode = (id, mode) => {
    setRooms(prev => prev.map(r => 
      r.id === id ? { ...r, selectedMode: mode, currentRate: ratesRef.current[mode] } : r
    ));
    setActiveDropdown(null);
  };

  // ===== 7. فتح الفاتورة (checkout) =====
  const openCheckout = async (id) => {
    try {
      await api.checkoutRoom(id);
      setRooms(prev => prev.map(r => 
        r.id === id ? { ...r, isCheckingOut: true } : r
      ));
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== 8. تأكيد الدفع =====
  const confirmPayment = async (id, finalAmount) => {
    const room = rooms.find(r => r.id === id);
    try {
      await api.payRoom(id, finalAmount, "Cash");

      const newTransaction = {
        id: Date.now(),
        roomName: room.name,
        amount: finalAmount,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setRevenueHistory(prev => [newTransaction, ...prev]);
      setTotalRevenue(prev => prev + finalAmount);
      setRooms(prev => prev.map(r => 
        r.id === id 
          ? { ...r, status: "idle", startTime: null, elapsed: 0, roomOrders: [], isCheckingOut: false, selectedMode: 'single', currentRate: ratesRef.current.single } 
          : r
      ));
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== 9. قبول طلب =====
  const acceptOrder = async (orderId) => {
    const order = pendingOrders.find(o => o.id === orderId);
    if (!order) return;
    try {
      await api.acceptOrder(orderId);

      setRooms(prev => prev.map(r => 
        r.name === order.roomName 
          ? { ...r, roomOrders: [...r.roomOrders, { name: order.itemName, price: order.price }] } 
          : r
      ));
      setInventory(prev => prev.map(item => 
        item.name === order.itemName ? { ...item, stock: Math.max(0, item.stock - 1) } : item
      ));
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== 10. رفض طلب =====
  const rejectOrder = async (orderId) => {
    try {
      await api.rejectOrder(orderId);
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== 11. تعديل المخزن =====
  const updateStock = async (productId, delta) => {
    const item = inventory.find(i => i.id === productId);
    if (!item) return;
    const newStock = Math.max(0, item.stock + delta);

    // Optimistic update
    setInventory(prev => prev.map(i => 
      i.id === productId ? { ...i, stock: newStock } : i
    ));

    try {
      await api.patchStock(productId, { stock: newStock });
    } catch (err) {
      // رجّع القيمة القديمة
      setInventory(prev => prev.map(i => 
        i.id === productId ? { ...i, stock: item.stock } : i
      ));
      alert(err.message);
    }
  };

  // ===== Logout =====
  const handleLogout = () => {
    api.logout();
    navigate("/login");
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ===== شاشات التحميل والخطأ =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold text-sm">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6" dir="rtl">
        <div className="bg-[#0f172a] border border-red-500/20 rounded-[2.5rem] p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-white font-black text-lg mb-2">تعذّر تحميل البيانات</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-gray-300 flex flex-col md:flex-row font-sans" dir="rtl">
      
      {/* Sidebar */}
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

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-[1.5rem] font-black hover:bg-red-600 hover:text-white transition-all"
        >
          <LogOut size={20} />
          تسجيل الخروج
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
                onKeyDown={(e) => e.key === "Enter" && addNewRoom()}
                className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white mb-6 focus:border-blue-600 outline-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowAddRoomModal(false)} className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold">إلغاء</button>
                <button onClick={addNewRoom} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">حفظ الغرفة</button>
              </div>
            </div>
          </div>
        )}

        {/* شاشة الأجهزة */}
        {view === "dashboard" && (
          <div className="animate-in fade-in duration-500">
            <header className="mb-10 text-right">
              <h1 className="text-3xl font-black text-white mb-2">إدارة الأجهزة</h1>
              <p className="text-gray-500">اختر النوع وابدأ الوقت</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-right">
              {rooms.map(room => {
                const rate = room.currentRate || rates[room.selectedMode] || rates.single;
                const timeCost = Math.ceil((room.elapsed / 3600) * rate);
                const ordersCost = (room.roomOrders || []).reduce((sum, item) => sum + (item.price || 0), 0);
                const totalCost = timeCost + ordersCost;

                return (
                  <div key={room.id} className={`group relative p-8 rounded-[3rem] border-2 transition-all duration-500 ${room.status === 'active' ? 'bg-[#0f172a] border-blue-600/50 shadow-2xl shadow-blue-900/20' : 'bg-[#0c0f17] border-white/5 hover:border-white/10'}`}>
                    
                    {room.isCheckingOut ? (
                      <div className="space-y-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <h4 className="text-blue-400 font-black flex items-center gap-2"><Receipt size={20}/> الفاتورة</h4>
                          <X className="cursor-pointer text-gray-600" onClick={() => setRooms(prev => prev.map(r => r.id === room.id ? {...r, isCheckingOut: false} : r))} />
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
                            <p className={`text-[11px] font-black uppercase mt-1 px-3 py-1 rounded-full w-fit ${room.status === 'active' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                              {room.selectedMode === 'multi' ? `وضع مالتي (${rates.multi})` : `وضع سنجل (${rates.single})`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setQrRoom(room)}
                              className="p-2 rounded-xl bg-white/5 text-emerald-400 hover:bg-white/10"
                              title="QR"
                            >
                              <QrCode size={18} />
                            </button>
                            <div className={`w-3 h-3 rounded-full ${room.status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-800'}`}></div>
                          </div>
                        </div>

                        <div className="bg-black/40 py-8 rounded-[2.5rem] text-center border border-white/5 mb-8">
                          <span className={`text-5xl font-mono font-black tracking-tighter ${room.status === 'active' ? 'text-white' : 'text-gray-800'}`}>
                            {formatTime(room.elapsed)}
                          </span>
                        </div>

                        {room.status === 'active' ? (
                          <button 
                            onClick={() => openCheckout(room.id)}
                            className="w-full py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 bg-white/5 text-white hover:bg-red-600 transition-all"
                          >
                            <Square size={18} fill="currentColor"/> إنهاء الوقت
                          </button>
                        ) : (
                          <div className="flex gap-2">
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
                                    <div className={`w-2 h-2 rounded-full ${room.selectedMode === 'single' ? 'bg-blue-500' : 'bg-gray-600'}`}></div> سنجل ({rates.single})
                                  </button>
                                  <button onClick={() => changeMode(room.id, 'multi')} className="w-full px-4 py-3 text-right text-sm hover:bg-white/5 text-white font-bold flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${room.selectedMode === 'multi' ? 'bg-purple-500' : 'bg-gray-600'}`}></div> مالتي ({rates.multi})
                                  </button>
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={() => startRoom(room.id, room.selectedMode)}
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

        {/* سجل الإيرادات */}
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

        {/* الطلبات المعلقة */}
        {view === "orders" && (
          <div className="max-w-4xl mx-auto animate-in duration-500 text-right text-white font-black">
            <h1 className="text-3xl mb-10">الطلبات المعلقة</h1>
            {pendingOrders.length === 0 ? (
              <div className="text-center text-gray-600 p-10 font-bold">لا توجد طلبات حالياً</div>
            ) : pendingOrders.map(order => (
              <div key={order.id} className="bg-[#0c0f17] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between mb-4">
                <div className="flex items-center gap-6">
                  <div className="bg-blue-600/10 text-blue-500 p-4 rounded-2xl">{order.roomName}</div>
                  <div><h4>{order.itemName}</h4><p className="text-sm text-gray-500">{order.price} EGP</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => rejectOrder(order.id)} className="p-4 bg-red-600/10 text-red-500 rounded-2xl"><X/></button>
                  <button onClick={() => acceptOrder(order.id)} className="p-4 bg-green-600 text-white rounded-2xl flex gap-2"><Check/> قبول</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* المخزن */}
        {view === "inventory" && (
          <div className="max-w-4xl mx-auto animate-in duration-500 text-right">
            <h1 className="text-3xl text-white font-black mb-10">المخزن</h1>
            {inventory.map(item => (
              <div key={item.id} className="bg-[#0c0f17] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between mb-4">
                <div><h4 className="text-white font-bold">{item.name}</h4><p className="text-blue-500">{item.price} EGP</p></div>
                <div className="flex items-center gap-6">
                  <span className="text-white font-black text-xl">{item.stock}</span>
                  <div className="flex gap-2">
                    <button onClick={() => updateStock(item.id, -1)} className="p-2 bg-white/5 rounded-lg text-gray-400"><Minus size={16}/></button>
                    <button onClick={() => updateStock(item.id, +1)} className="p-2 bg-white/5 rounded-lg text-gray-400"><Plus size={16}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {qrRoom && (
        <QrCardModal room={qrRoom} onClose={() => setQrRoom(null)} />
      )}
    </div>
  );
}

// ===== Normalizers =====
function normalizePending(list = []) {
  return (list || []).map(normalizePendingOrder);
}

function normalizePendingOrder(o) {
  if (!o) return { id: 0, roomName: "—", itemName: "—", price: 0, time: "" };
  return {
    id: o.id,
    roomName: o.roomName || o.room?.name || "—",
    itemName: o.itemName || o.productName || o.items?.[0]?.name || "—",
    price: o.price || o.total || o.items?.[0]?.price || 0,
    time: o.time || o.createdAt || "",
  };
}

function normalizeProducts(list = []) {
  return (list || []).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock ?? 0,
  }));
}

function normalizeTransactions(list = []) {
  return (list || []).map(t => ({
    id: t.id,
    roomName: t.roomName || t.room?.name || "—",
    amount: t.amount || t.total || 0,
    time: t.time || t.createdAt || "",
  }));
}

function startTimeMs(start) {
  if (start == null || start === "") return 0;
  if (typeof start === "number") return start;
  const numeric = Number(start);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 1e12 ? numeric * 1000 : numeric;
  }
  const parsed = Date.parse(start);
  return Number.isFinite(parsed) ? parsed : 0;
}

function withIdleRate(room, rates) {
  if (room.status === "active" && room.currentRate != null) return room;
  const mode = room.selectedMode === "multi" ? "multi" : "single";
  return { ...room, currentRate: room.currentRate ?? rates[mode] };
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