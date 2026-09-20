import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, LayoutDashboard, DoorOpen, ShoppingCart, Timer, Users,
  Package, BarChart3, UserCog, Layers, Settings, Menu, Bell,
  ChevronDown, CreditCard, X, Edit, Trash2, Plus, Search, LogOut, QrCode
} from 'lucide-react';
import QrCardModal from '../QrCardModal';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis,
  Tooltip, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { api, connectOrdersHub, getUser, getToken } from '../api';

const CyberCafeDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  // بيانات الـ API
  const [stats, setStats] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [qrRoom, setQrRoom] = useState(null);
  const hubRef = useRef(null);

  // ===== Responsive detection =====
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // ===== Logout =====
  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  // ===== تحميل الـ branches أول حاجة =====
  useEffect(() => {
    let cancelled = false;
    api.branches()
      .then((list) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setBranches(arr);
        // اختار فرع المستخدم أو أول فرع
        const userBranch = user?.branchId;
        const initial = arr.find(b => b.id === userBranch) || arr[0];
        setSelectedBranch(initial?.id ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "فشل تحميل الفروع");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [user?.branchId]);

  // ===== تحميل بيانات الفرع المختار =====
  useEffect(() => {
    if (selectedBranch === null || selectedBranch === undefined) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.dashboard(selectedBranch).catch(() => null),
      api.rooms(selectedBranch).catch(() => []),
      api.orders(selectedBranch).catch(() => []),
      api.customers(selectedBranch).catch(() => []),
      api.products(selectedBranch).catch(() => []),
      api.staff().catch(() => []),
      api.categories(selectedBranch).catch(() => []),
      api.settings(selectedBranch).catch(() => null),
      api.sessions(selectedBranch, true).catch(() => []),
    ]).then(([dash, rms, ords, custs, prods, stf, cats, stgs, sess]) => {
      if (cancelled) return;

      // Dashboard
      setStats(normalizeStats(dash?.stats));
      setRevenueData(normalizeRevenue(dash?.revenueData));
      setPieData(normalizePie(dash?.pieData));
      setTopProducts(normalizeTopProducts(dash?.topProducts));

      setRooms(normalizeRooms(rms));
      setOrders(normalizeOrders(ords));
      setSessions(normalizeSessions(sess));
      setCustomers(normalizeCustomers(custs));
      setProducts(normalizeProducts(prods));
      setStaff(normalizeStaff(stf));
      setCategories(normalizeCategories(cats));
      setSettings(normalizeSettings(stgs));

      setLoading(false);
    }).catch((err) => {
      if (!cancelled) {
        setError(err.message || "فشل تحميل البيانات");
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [selectedBranch, reloadToken]);

  // ===== SignalR للتحديثات اللحظية =====
  useEffect(() => {
    if (!getToken()) return;
    let conn;

    connectOrdersHub({
      onOrderCreated: (payload) => {
        const order = payload?.admin;
        if (order) setOrders(prev => [normalizeOrder(order), ...prev]);
      },
      onOrderUpdated: (order) => {
        setOrders(prev => prev.map(o => o.id === order.id ? normalizeOrder(order) : o));
      },
      onRoomUpdated: (room) => {
        setRooms(prev => {
          const mapped = normalizeRoom(room);
          const exists = prev.find(r => r.id === mapped.id);
          return exists
            ? prev.map(r => r.id === mapped.id ? mapped : r)
            : [...prev, mapped];
        });
      },
      onSessionEnded: ({ roomId }) => {
        setSessions(prev => prev.filter(s => s.room !== roomId));
        setRooms(prev => prev.map(r => 
          r.id === roomId ? { ...r, status: 'Available', user: '-', time: '-', price: '-' } : r
        ));
      },
    }).then(c => { conn = c; hubRef.current = c; }).catch(console.error);

    return () => { conn?.stop(); hubRef.current = null; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshAll = () => {
    if (selectedBranch == null) return;
    setReloadToken((n) => n + 1);
  };

  const showError = (err) => {
    const msg = err?.message || "حدث خطأ";
    setToast(msg);
    window.alert(msg);
  };

  const run = async (fn) => {
    try {
      setBusy(true);
      await fn();
      setModal(null);
      setToast("تم الحفظ");
      refreshAll();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const submitModal = (form) => {
    if (!modal) return;
    switch (modal.kind) {
      case "room-add":
        return run(async () => {
          const created = await api.createRoom(form.name, selectedBranch);
          setQrRoom(normalizeRoom(created));
        });
      case "room-edit":
        return run(() => api.updateRoom(modal.record.id, { name: form.name }));
      case "customer-add":
        return run(() => api.createCustomer({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          branchId: selectedBranch,
        }));
      case "customer-edit":
        return run(() => api.updateCustomer(modal.record.id, {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          branchId: selectedBranch,
        }));
      case "product-add":
        return run(() => api.createProduct({
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock || 0),
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          branchId: selectedBranch,
        }));
      case "product-edit":
        return run(() => api.updateProduct(modal.record.id, {
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock || 0),
          categoryId: form.categoryId ? Number(form.categoryId) : modal.record.categoryId,
          branchId: selectedBranch,
        }));
      case "staff-add":
        return run(() => api.createStaff({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role || "Staff",
          branchId: selectedBranch,
        }));
      case "staff-edit":
        return run(() => api.updateStaff(modal.record.id, {
          name: form.name,
          role: form.role || "Staff",
          branchId: selectedBranch,
        }));
      case "category-add":
        return run(() => api.createCategory(form.name, selectedBranch));
      case "settings": {
        const taxInput = Number(form.taxPercent);
        const taxRate = taxInput > 1 ? taxInput / 100 : taxInput;
        return run(() => api.updateSettings(selectedBranch, {
          branchName: form.branchName,
          singleHourlyRate: Number(form.singleHourlyRate),
          multiHourlyRate: Number(form.multiHourlyRate),
          taxRate,
        }));
      }
      case "order-status":
        return run(() => api.patchOrderStatus(modal.record.id, form.status));
      default:
        return null;
    }
  };

  const modalConfig = modal ? getModalConfig(modal, categories, settings) : null;

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardContent
            stats={stats}
            revenueData={revenueData}
            pieData={pieData}
            topProducts={topProducts}
            rooms={rooms}
            orders={orders}
          />
        );
      case 'rooms':
        return (
          <RoomsContent
            rooms={rooms}
            onAdd={() => setModal({ kind: "room-add" })}
            onEdit={(room) => setModal({ kind: "room-edit", record: room })}
            onQr={(room) => setQrRoom(room)}
            onDelete={(room) => {
              if (!window.confirm(`Delete ${room.name || `Room ${room.id}`}?`)) return;
              run(() => api.deleteRoom(room.id));
            }}
          />
        );
      case 'orders':
        return (
          <OrdersContent
            orders={orders}
            onStatus={(order) => setModal({ kind: "order-status", record: order })}
          />
        );
      case 'sessions':
        return (
          <SessionsContent
            sessions={sessions}
            onEnd={(session) => {
              if (!session.id) return;
              if (!window.confirm(`End session in Room ${session.roomName || session.room}?`)) return;
              run(() => api.endSession(session.id));
            }}
          />
        );
      case 'customers':
        return (
          <CustomersContent
            customers={customers}
            onAdd={() => setModal({ kind: "customer-add" })}
            onEdit={(customer) => setModal({ kind: "customer-edit", record: customer })}
            onDelete={(customer) => {
              if (!window.confirm(`Delete ${customer.name}?`)) return;
              run(() => api.deleteCustomer(customer.id));
            }}
          />
        );
      case 'products':
        return (
          <ProductsContent
            products={products}
            onAdd={() => setModal({ kind: "product-add" })}
            onEdit={(product) => setModal({ kind: "product-edit", record: product })}
            onDelete={(product) => {
              if (!window.confirm(`Delete ${product.name}?`)) return;
              run(() => api.deleteProduct(product.id));
            }}
          />
        );
      case 'reports':
        return <ReportsContent revenueData={revenueData} pieData={pieData} topProducts={topProducts} />;
      case 'staff':
        return (
          <StaffContent
            staff={staff}
            onAdd={() => setModal({ kind: "staff-add" })}
            onEdit={(member) => setModal({ kind: "staff-edit", record: member })}
            onDelete={(member) => {
              if (!window.confirm(`Delete ${member.name}?`)) return;
              run(() => api.deleteStaff(member.id));
            }}
          />
        );
      case 'categories':
        return (
          <CategoriesContent
            categories={categories}
            onAdd={() => setModal({ kind: "category-add" })}
            onDelete={(cat) => {
              if (!window.confirm(`Delete ${cat.name}?`)) return;
              run(() => api.deleteCategory(cat.id));
            }}
          />
        );
      case 'settings':
        return (
          <SettingsContent
            settings={settings}
            onEdit={() => setModal({ kind: "settings" })}
          />
        );
      default:
        return null;
    }
  };

  // ===== شاشة تحميل =====
  if (loading && branches.length === 0) {
    return (
      <div className="flex h-screen bg-[#07090d] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // ===== شاشة خطأ =====
  if (error && branches.length === 0) {
    return (
      <div className="flex h-screen bg-[#07090d] items-center justify-center p-6">
        <div className="bg-[#0f172a] border border-red-500/20 rounded-[28px] p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-white font-black text-lg mb-2">تعذّر التحميل</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={handleLogout} className="mt-6 px-6 py-3 bg-red-600/10 text-red-500 rounded-xl font-bold">
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#07090d] text-gray-400 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#0c0f17] border-r border-gray-800 flex flex-col z-50
          transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        {isMobile && (
          <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-5 right-5 p-1 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        )}

        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#1e40af] p-2 rounded-lg text-white shadow-lg shadow-blue-900/20">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-white tracking-wider uppercase">Atari playstation</h1>
            <p className="text-[9px] text-gray-500 font-medium">MANAGEMENT SYSTEM</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-2 space-y-8 overflow-y-auto">
          <div>
            <p className="text-[10px] font-bold text-gray-600 uppercase mb-4 px-2 tracking-widest">Main</p>
            <nav className="space-y-1">
              <SidebarItem 
                icon={<LayoutDashboard size={18}/>} 
                label="Dashboard" 
                active={activeView === 'dashboard'} 
                onClick={() => { setActiveView('dashboard'); if(isMobile) setSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={<DoorOpen size={18}/>} 
                label="Rooms" 
                active={activeView === 'rooms'} 
                onClick={() => { setActiveView('rooms'); if(isMobile) setSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={<ShoppingCart size={18}/>} 
                label="Orders" 
                badge={orders.length.toString()} 
                active={activeView === 'orders'} 
                onClick={() => { setActiveView('orders'); if(isMobile) setSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={<Timer size={18}/>} 
                label="Sessions" 
                active={activeView === 'sessions'} 
                onClick={() => { setActiveView('sessions'); if(isMobile) setSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={<Users size={18}/>} 
                label="Customers" 
                active={activeView === 'customers'} 
                onClick={() => { setActiveView('customers'); if(isMobile) setSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={<Package size={18}/>} 
                label="Products" 
                active={activeView === 'products'} 
                onClick={() => { setActiveView('products'); if(isMobile) setSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={<BarChart3 size={18}/>} 
                label="Reports" 
                active={activeView === 'reports'} 
                onClick={() => { setActiveView('reports'); if(isMobile) setSidebarOpen(false); }}
              />
            </nav>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-600 uppercase mb-4 px-2 tracking-widest">Management</p>
            <nav className="space-y-1">
              <SidebarItem 
                icon={<UserCog size={18}/>} 
                label="Staff" 
                active={activeView === 'staff'} 
                onClick={() => { setActiveView('staff'); if(isMobile) setSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={<Layers size={18}/>} 
                label="Categories" 
                active={activeView === 'categories'} 
                onClick={() => { setActiveView('categories'); if(isMobile) setSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={<Settings size={18}/>} 
                label="Settings" 
                active={activeView === 'settings'} 
                onClick={() => { setActiveView('settings'); if(isMobile) setSidebarOpen(false); }}
              />
            </nav>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[16px] bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            <span className="text-[12px] font-bold tracking-wide">تسجيل الخروج</span>
          </button>

          {/* Today's Overview Sidebar Card */}
          {stats[0] && (
            <div className="hidden sm:block bg-[#111622] rounded-2xl p-4 border border-gray-800/50">
              <p className="text-[10px] text-gray-500 font-medium">Today's Overview</p>
              <p className="text-[11px] mt-3 text-gray-300">Total Revenue</p>
              <p className="text-xl font-bold text-[#10b981] mt-0.5">{stats[0].value} <span className="text-[10px] font-medium text-gray-500">EGP</span></p>
              <p className="text-[10px] text-[#10b981] mt-1 font-bold">{stats[0].diff} <span className="text-gray-600 font-normal">from yesterday</span></p>
              <div className="h-12 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <Line type="monotone" dataKey="rev" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#07090d] relative custom-scrollbar">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 sm:px-6 md:px-8 py-4 sticky top-0 bg-[#07090d]/90 backdrop-blur-xl z-30 border-b border-gray-800/30">
          <div className="flex items-center gap-5">
            <Menu 
              className="text-gray-500 cursor-pointer hover:text-white transition-colors lg:hidden" 
              size={20}
              onClick={() => setSidebarOpen(true)}
            />
            <div>
              <h2 className="text-white text-sm font-semibold flex items-center gap-2">
                Welcome back, {user?.name || 'Admin'} 👋
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5 hidden sm:block">Here's what's happening today.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex flex-wrap gap-2 bg-[#111622] p-1 rounded-xl border border-gray-800">
              {branches.map(b => (
                <button 
                  key={b.id}
                  onClick={() => setSelectedBranch(b.id)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${selectedBranch === b.id ? 'bg-[#1e40af] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l border-gray-800 pl-4 md:pl-6">
              <div className="relative cursor-pointer text-gray-400 hover:text-white">
                <Bell size={19} />
                {orders.filter((o) => o.status === "NEW" || o.status === "PREPARING").length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-[#07090d]">
                    {orders.filter((o) => o.status === "NEW" || o.status === "PREPARING").length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden xs:block">
                  <p className="text-xs font-bold text-white leading-none">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{user?.role || 'Super Admin'}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#1e40af] border border-gray-700 shadow-xl flex items-center justify-center text-white font-bold">
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 md:px-8 py-6">
          {/* Date Selector */}
          <div className="flex justify-end mb-6">
            <div className="bg-[#111622] text-[11px] font-bold text-gray-400 px-4 py-2 rounded-xl border border-gray-800 flex items-center gap-2 cursor-pointer hover:border-gray-600 transition-all">
              <Activity size={14} className="text-blue-500" /> 
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Dynamic Content */}
          {renderContent()}
          
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[90] bg-[#111622] border border-gray-700 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-2xl max-w-sm">
          {toast}
        </div>
      )}

      {modal && modalConfig && (
        <FormModal
          key={`${modal.kind}-${modal.record?.id ?? "new"}`}
          title={modalConfig.title}
          fields={modalConfig.fields}
          initial={modalConfig.initial}
          busy={busy}
          submitLabel={modalConfig.submitLabel}
          onClose={() => !busy && setModal(null)}
          onSubmit={submitModal}
        />
      )}

      {qrRoom && (
        <QrCardModal room={qrRoom} onClose={() => setQrRoom(null)} />
      )}
    </div>
  );
};

// ---------------------- SIDEBAR ITEM ----------------------
const SidebarItem = ({ icon, label, active, badge, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between px-3.5 py-3 rounded-[16px] cursor-pointer transition-all duration-300 group ${active ? 'bg-[#1e40af] text-white shadow-xl shadow-blue-900/30' : 'text-gray-500 hover:bg-[#111622] hover:text-gray-300'}`}
  >
    <div className="flex items-center gap-3.5">
      <span className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-blue-400 transition-colors'}`}>{icon}</span>
      <span className="text-[12px] font-bold tracking-wide">{label}</span>
    </div>
    {badge && badge !== '0' && <span className="bg-[#6366f1] text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg">{badge}</span>}
  </div>
);

// ---------------------- DASHBOARD CONTENT ----------------------
const DashboardContent = ({ stats, revenueData, pieData, topProducts, rooms, orders }) => (
  <>
    {/* Stats Cards Row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {stats.map((s, i) => (
        <div key={i} className="bg-[#0c0f17] border border-gray-800/60 rounded-[24px] p-4 md:p-5 relative overflow-hidden group hover:border-gray-700 transition-all">
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }}></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-2 rounded-xl border border-gray-800" style={{ backgroundColor: s.bg, color: s.color }}>
              <StatsIcon name={s.icon} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{s.label}</p>
              <p className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight">{s.value} <span className="text-[11px] text-gray-500 font-medium">EGP</span></p>
              <p className="text-[10px] mt-1.5 font-bold" style={{ color: s.color }}>{s.diff} <span className="text-gray-600 font-medium ml-1">from yesterday</span></p>
            </div>
          </div>
          <div className="mt-4 h-8 opacity-40 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={s.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="rev" stroke={s.color} fillOpacity={1} fill={`url(#color-${i})`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>

    {/* Rooms & Orders Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-7">
          <h3 className="text-white font-bold text-[15px]">Rooms Status</h3>
          <div className="flex flex-wrap gap-5">
            <StatusBadge color="#ef4444" label="Occupied" />
            <StatusBadge color="#10b981" label="Available" />
            <StatusBadge color="#f59e0b" label="Maintenance" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {rooms.map(room => (
            <div key={room.id} className={`p-3 md:p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${room.status === 'Occupied' ? 'bg-[#ef4444]/[0.03] border-[#ef4444]/20' : 'bg-[#10b981]/[0.03] border-[#10b981]/20'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className={`p-1.5 rounded-lg ${room.status === 'Occupied' ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-[#10b981]/10 text-[#10b981]'}`}>
                  <Activity size={14} />
                </div>
                <span className={`text-[11px] font-black uppercase ${room.status === 'Occupied' ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>{room.name || `Room ${room.id}`}</span>
              </div>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{room.status}</p>
              <p className="text-xs font-bold text-white mt-1.5 truncate">{room.user}</p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800/50">
                <span className="text-[10px] text-gray-500 font-medium">{room.time}</span>
                <span className="text-[10px] font-black text-[#f59e0b] tracking-tighter">{room.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-white font-bold text-[15px]">Live Orders</h3>
          <span className="text-[11px] font-bold text-blue-500 cursor-pointer hover:underline">View All</span>
        </div>
        <div className="space-y-7 flex-1">
          {orders.slice(0, 4).map(order => (
            <OrderItem 
              key={order.id} 
              room={order.room} 
              items={order.items} 
              time={order.time} 
              status={order.status} 
              color={order.color} 
              emoji={order.emoji} 
            />
          ))}
        </div>
      </div>
    </div>

    {/* Bottom Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
        <div className="flex justify-between items-center mb-7">
          <h3 className="text-white font-bold text-[14px]">Top Selling Products</h3>
          <span className="text-[11px] text-blue-500 font-bold">View All</span>
        </div>
        <div className="space-y-5">
          {topProducts.map((prod, idx) => (
            <ProductRow key={idx} label={prod.label} val={prod.val} max={prod.max} emoji={prod.emoji} color={prod.color} />
          ))}
        </div>
      </div>

      <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40 relative">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h3 className="text-white font-bold text-[14px]">Today's Revenue</h3>
          <div className="flex items-center gap-1 text-[10px] bg-[#111622] px-2 py-1 rounded-lg border border-gray-800">
            This Week <ChevronDown size={12}/>
          </div>
        </div>
        <div className="h-40 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="mainRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} dy={10} />
              <Tooltip contentStyle={{backgroundColor: '#111622', border: '1px solid #1f2937', borderRadius: '12px', fontSize: '10px'}} />
              <Area type="monotone" dataKey="rev" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#mainRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
        <h3 className="text-white font-bold text-[14px] mb-6">Payment Methods</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-32 h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={35} outerRadius={50} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-gray-500 font-medium">Total</span>
              <span className="text-[12px] text-white font-black">100%</span>
            </div>
          </div>
          <div className="flex-1 space-y-3 pl-0 sm:pl-4">
            {pieData.map((item, i) => {
              const total = pieData.reduce((sum, curr) => sum + curr.value, 0);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                  <div>
                    <p className="text-[10px] text-white font-bold leading-none">{item.name}</p>
                    <p className="text-[8px] text-gray-500 mt-1">{item.value} EGP ({total ? Math.round(item.value/total*100) : 0}%)</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </>
);

// ---------------------- ROOMS PAGE ----------------------
const RoomsContent = ({ rooms, onAdd, onEdit, onDelete, onQr }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h3 className="text-white font-bold text-lg">Manage Rooms</h3>
      <button onClick={onAdd} className="flex items-center gap-2 bg-[#1e40af] hover:bg-blue-800 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all">
        <Plus size={14} /> Add Room
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-gray-800">
          <tr>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Room</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Status</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">User</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Time</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Price</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => (
            <tr key={room.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
              <td className="py-3 text-sm font-bold text-white">{room.name || `Room ${room.id}`}</td>
              <td className="py-3">
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${room.status === 'Occupied' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {room.status}
                </span>
              </td>
              <td className="py-3 text-sm text-gray-300">{room.user}</td>
              <td className="py-3 text-sm text-gray-400">{room.time}</td>
              <td className="py-3 text-sm text-[#f59e0b] font-bold">{room.price}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onQr(room)} className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" title="QR"><QrCode size={14} /></button>
                  <button onClick={() => onEdit(room)} className="p-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><Edit size={14} /></button>
                  <button onClick={() => onDelete(room)} className="p-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ---------------------- ORDERS PAGE ----------------------
const OrdersContent = ({ orders, onStatus }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h3 className="text-white font-bold text-lg">All Orders</h3>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        <input type="text" placeholder="Search orders..." className="bg-[#111622] border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
      </div>
    </div>
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-10 text-gray-600 font-bold">لا توجد طلبات</div>
      ) : orders.map(order => (
        <div key={order.id} className="flex flex-wrap items-center justify-between p-4 bg-[#111622] rounded-2xl border border-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl">{order.emoji}</div>
            <div>
              <p className="text-white font-bold text-sm">Order #{order.id}</p>
              <p className="text-[10px] text-gray-500">Room {order.room} • {order.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-white">{order.amount} EGP</span>
            <span className="text-[8px] font-black px-2.5 py-1.5 rounded-lg border" style={{ color: order.color, borderColor: `${order.color}30`, backgroundColor: `${order.color}10` }}>
              {order.status}
            </span>
            <button onClick={() => onStatus(order)} className="text-blue-400 text-xs font-bold hover:underline">Update status</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------- SESSIONS PAGE ----------------------
const SessionsContent = ({ sessions, onEnd }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <h3 className="text-white font-bold text-lg mb-6">Active Sessions</h3>
    <div className="grid gap-4">
      {sessions.length === 0 ? (
        <div className="text-center py-10 text-gray-600 font-bold">لا توجد جلسات نشطة</div>
      ) : sessions.map((session) => (
        <div key={session.id} className="flex flex-wrap items-center justify-between p-4 bg-[#111622] rounded-2xl border border-gray-800/50">
          <div>
            <p className="text-white font-bold">{session.roomName || `Room ${session.room}`}</p>
            <p className="text-[10px] text-gray-500">Started {session.started}</p>
          </div>
          <div className="flex items-center gap-4">
            <Timer size={16} className="text-[#f59e0b]" />
            <span className="text-sm text-white">{session.duration}</span>
            <button onClick={() => onEnd(session)} className="bg-red-500/20 text-red-400 text-xs font-bold py-1 px-3 rounded-lg">End Session</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------- CUSTOMERS PAGE ----------------------
const CustomersContent = ({ customers, onAdd, onEdit, onDelete }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
      <h3 className="text-white font-bold text-lg">Customers List</h3>
      <button onClick={onAdd} className="flex items-center gap-2 bg-[#1e40af] hover:bg-blue-800 text-white text-xs font-bold py-2 px-4 rounded-xl"><Plus size={14} /> Add Customer</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-gray-800">
          <tr>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Name</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Email</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Phone</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Total Spent</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
              <td className="py-3 text-sm text-white">{customer.name}</td>
              <td className="py-3 text-sm text-gray-400">{customer.email}</td>
              <td className="py-3 text-sm text-gray-400">{customer.phone}</td>
              <td className="py-3 text-sm text-[#10b981] font-bold">{customer.spent} EGP</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(customer)} className="p-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><Edit size={14} /></button>
                  <button onClick={() => onDelete(customer)} className="p-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ---------------------- PRODUCTS PAGE ----------------------
const ProductsContent = ({ products, onAdd, onEdit, onDelete }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-white font-bold text-lg">Products Inventory</h3>
      <button onClick={onAdd} className="flex items-center gap-2 bg-[#1e40af] text-white text-xs font-bold py-2 px-4 rounded-xl"><Plus size={14} /> Add Product</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((prod) => (
        <div key={prod.id} className="bg-[#111622] rounded-2xl p-4 border border-gray-800/50 flex justify-between items-center">
          <div>
            <p className="text-white font-bold">{prod.name}</p>
            <p className="text-[10px] text-gray-500">Price: {prod.price} EGP</p>
            <p className="text-[9px] text-gray-600">Stock: {prod.stock}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(prod)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Edit size={14} /></button>
            <button onClick={() => onDelete(prod)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------- REPORTS PAGE ----------------------
const ReportsContent = ({ revenueData, pieData, topProducts }) => (
  <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
        <h3 className="text-white font-bold mb-4">Weekly Revenue Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs><linearGradient id="reportRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="day" tick={{fill: '#9ca3af'}}/>
              <YAxis tick={{fill: '#9ca3af'}}/>
              <Tooltip contentStyle={{backgroundColor: '#111622', border: '1px solid #374151'}}/>
              <Area type="monotone" dataKey="rev" stroke="#8b5cf6" fill="url(#reportRev)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
        <h3 className="text-white font-bold mb-4">Payment Distribution</h3>
        <div className="h-64 flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
      <h3 className="text-white font-bold mb-4">Top Products</h3>
      <div className="space-y-4">
        {topProducts.map((prod, idx) => (
          <ProductRow key={idx} label={prod.label} val={prod.val} max={prod.max} emoji={prod.emoji} color={prod.color} />
        ))}
      </div>
    </div>
  </>
);

// ---------------------- STAFF PAGE ----------------------
const StaffContent = ({ staff, onAdd, onEdit, onDelete }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-white font-bold text-lg">Staff Management</h3>
      <button onClick={onAdd} className="flex items-center gap-2 bg-[#1e40af] text-white text-xs font-bold py-2 px-4 rounded-xl"><Plus size={14} /> Add Staff</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {staff.map((member) => (
        <div key={member.id} className="bg-[#111622] rounded-2xl p-4 border border-gray-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">{member.initial}</div>
            <div>
              <p className="text-white font-bold">{member.name}</p>
              <p className="text-[10px] text-gray-500">Role: {member.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(member)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Edit size={14} /></button>
            <button onClick={() => onDelete(member)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------- CATEGORIES PAGE ----------------------
const CategoriesContent = ({ categories, onAdd, onDelete }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-white font-bold text-lg">Product Categories</h3>
      <button onClick={onAdd} className="flex items-center gap-2 bg-[#1e40af] text-white text-xs font-bold py-2 px-4 rounded-xl"><Plus size={14} /> Add Category</button>
    </div>
    <div className="flex flex-wrap gap-3">
      {categories.map((cat) => (
        <div key={cat.id} className="bg-[#111622] rounded-2xl px-4 py-2 border border-gray-800/50 flex items-center gap-3">
          <span className="text-white font-medium">{cat.name}</span>
          <button onClick={() => onDelete(cat)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------- SETTINGS PAGE ----------------------
const SettingsContent = ({ settings, onEdit }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <h3 className="text-white font-bold text-lg mb-6">System Settings</h3>
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111622] rounded-2xl">
        <div><p className="text-white font-medium">Branch Name</p><p className="text-[10px] text-gray-500">{settings?.branchName || '—'}</p></div>
        <button onClick={onEdit} className="text-blue-400 text-xs font-bold">Edit</button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111622] rounded-2xl">
        <div>
          <p className="text-white font-medium">Single hourly rate</p>
          <p className="text-[10px] text-gray-500">
            {settings?.singleHourlyRate != null ? `${settings.singleHourlyRate} EGP / hour` : (settings?.hourlyRate || '—')}
          </p>
        </div>
        <button onClick={onEdit} className="text-blue-400 text-xs font-bold">Edit</button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111622] rounded-2xl">
        <div>
          <p className="text-white font-medium">Multi hourly rate</p>
          <p className="text-[10px] text-gray-500">
            {settings?.multiHourlyRate != null ? `${settings.multiHourlyRate} EGP / hour` : '—'}
          </p>
        </div>
        <button onClick={onEdit} className="text-blue-400 text-xs font-bold">Edit</button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111622] rounded-2xl">
        <div><p className="text-white font-medium">Tax Rate</p><p className="text-[10px] text-gray-500">{settings?.taxRate || '—'}</p></div>
        <button onClick={onEdit} className="text-blue-400 text-xs font-bold">Edit</button>
      </div>
    </div>
  </div>
);

// ---------------------- REUSABLE COMPONENTS ----------------------
const StatusBadge = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></div>
    <span className="text-[10px] text-gray-500 font-bold">{label}</span>
  </div>
);

const OrderItem = ({ room, items, time, status, color, emoji }) => (
  <div className="flex items-center justify-between group cursor-pointer flex-wrap gap-2">
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-2xl bg-[#111622] border border-gray-800 flex items-center justify-center text-xl shadow-inner group-hover:border-gray-600 transition-all">
        {emoji}
      </div>
      <div>
        <p className="text-[12px] font-black text-white leading-tight">Room {room}</p>
        <p className="text-[10px] text-gray-500 font-medium mt-1">{items}</p>
      </div>
    </div>
    <div className="text-right">
       <p className="text-[9px] text-gray-600 font-bold mb-1.5 uppercase tracking-tighter">{time}</p>
       <span className="text-[8px] font-black px-2.5 py-1.5 rounded-lg border tracking-widest" style={{ color: color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
         {status}
       </span>
    </div>
  </div>
);

const ProductRow = ({ label, val, max, emoji, color }) => (
  <div className="flex items-center gap-4">
    <span className="text-lg w-6">{emoji}</span>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] text-white font-bold">{label}</span>
        <span className="text-[11px] text-gray-400 font-black">{val}</span>
      </div>
      <div className="w-full bg-[#111622] h-2 rounded-full border border-gray-800/50 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${max ? (val/max)*100 : 0}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}></div>
      </div>
    </div>
  </div>
);

// ---------------------- Stats Icon Mapper ----------------------
const StatsIcon = ({ name }) => {
  const props = { size: 20 };
  switch (name) {
    case 'revenue': return <CreditCard {...props} />;
    case 'orders': return <ShoppingCart {...props} />;
    case 'sessions': return <Timer {...props} />;
    case 'customers': return <Users {...props} />;
    default: return <CreditCard {...props} />;
  }
};

// ================================================================
// NORMALIZERS — عدّلها حسب شكل الباك
// ================================================================

const STAT_COLORS = {
  revenue: '#10b981',
  orders: '#8b5cf6',
  sessions: '#f59e0b',
  customers: '#3b82f6',
};

function normalizeStats(raw) {
  // لو الباك رجّع array جاهزة
  if (Array.isArray(raw) && raw.length) {
    return raw.map((s, i) => ({
      label: s.label || s.name || '',
      value: String(s.value ?? 0),
      diff: s.diff || s.change || '—',
      color: s.color || Object.values(STAT_COLORS)[i % 4],
      icon: s.icon || ['revenue','orders','sessions','customers'][i % 4],
      bg: s.bg || 'rgba(99,102,241,0.1)',
    }));
  }
  // لو الباك رجّع object
  if (raw && typeof raw === 'object') {
    return [
      { label: 'Total Revenue', value: String(raw.totalRevenue ?? raw.revenue ?? 0), diff: raw.revenueDiff ?? '—', color: STAT_COLORS.revenue, icon: 'revenue', bg: 'rgba(16,185,129,0.1)' },
      { label: 'Total Orders', value: String(raw.totalOrders ?? raw.orders ?? 0), diff: raw.ordersDiff ?? '—', color: STAT_COLORS.orders, icon: 'orders', bg: 'rgba(139,92,246,0.1)' },
      { label: 'Active Sessions', value: String(raw.activeSessions ?? raw.sessions ?? 0), diff: raw.sessionsDiff ?? '—', color: STAT_COLORS.sessions, icon: 'sessions', bg: 'rgba(245,158,11,0.1)' },
      { label: 'Total Customers', value: String(raw.totalCustomers ?? raw.customers ?? 0), diff: raw.customersDiff ?? '—', color: STAT_COLORS.customers, icon: 'customers', bg: 'rgba(59,130,246,0.1)' },
    ];
  }
  return [];
}

function normalizeRevenue(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(r => ({
    day: r.day || r.date || r.label || '',
    rev: Number(r.rev ?? r.revenue ?? r.value ?? 0),
  }));
}

function normalizePie(raw) {
  if (!Array.isArray(raw)) return [];
  const colors = ['#10b981', '#6366f1', '#3b82f6'];
  return raw.map((p, i) => ({
    name: p.name || p.label || '',
    value: Number(p.value ?? p.amount ?? 0),
    color: p.color || colors[i % colors.length],
  }));
}

function normalizeTopProducts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(p => ({
    label: p.label || p.name || '',
    val: Number(p.val ?? p.count ?? p.quantity ?? 0),
    max: Number(p.max ?? p.total ?? 50),
    emoji: p.emoji || '📦',
    color: p.color || '#6366f1',
  }));
}

function normalizeRoom(r) {
  const occupied = String(r.status || '').toLowerCase() === 'occupied' || r.status === 'active';
  return {
    id: r.id ?? r.roomId,
    name: r.name || `Room ${r.id ?? r.roomId}`,
    qrToken: r.qrToken,
    status: occupied ? 'Occupied' : 'Available',
    user: r.user || r.customerName || '-',
    time: r.time || r.elapsed || '-',
    price: r.price ? (String(r.price).includes('EGP') ? r.price : `${r.price} EGP`) : '-',
  };
}

function normalizeRooms(raw) {
  return Array.isArray(raw) ? raw.map(normalizeRoom) : [];
}

function normalizeOrder(o) {
  const statusMap = {
    new: { label: 'NEW', color: '#ef4444' },
    pending: { label: 'NEW', color: '#ef4444' },
    preparing: { label: 'PREPARING', color: '#f59e0b' },
    ready: { label: 'READY', color: '#10b981' },
    delivered: { label: 'DELIVERED', color: '#3b82f6' },
    paid: { label: 'PAID', color: '#3b82f6' },
  };
  const st = String(o.status || 'new').toLowerCase();
  const meta = statusMap[st] || statusMap.new;
  return {
    id: o.id,
    room: o.room ?? o.roomId ?? o.roomNumber ?? '?',
    items: o.items ? (Array.isArray(o.items) ? o.items.map(i => `${i.qty || i.quantity || 1} x ${i.name || i.productName || ''}`).join(', ') : String(o.items)) : '',
    time: o.time || o.createdAt || '',
    status: meta.label,
    color: meta.color,
    emoji: o.emoji || '🍽️',
    amount: o.amount || o.total || 0,
  };
}

function normalizeOrders(raw) {
  return Array.isArray(raw) ? raw.map(normalizeOrder) : [];
}

function normalizeSessions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(s => ({
    id: s.id,
    room: s.room ?? s.roomId ?? s.roomNumber ?? '?',
    roomName: s.roomName || (s.room != null ? `Room ${s.room}` : ''),
    started: s.started || s.startTime || '',
    duration: s.duration || s.elapsed || '',
  }));
}

function normalizeCustomers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(c => ({
    id: c.id,
    name: c.name || '',
    email: c.email || '',
    phone: c.phone || '',
    spent: c.spent ?? c.totalSpent ?? 0,
  }));
}

function normalizeProducts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock ?? 0,
    categoryId: p.categoryId ?? '',
    category: p.category || '',
  }));
}

function normalizeStaff(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(s => ({
    id: s.id,
    name: s.name || '',
    email: s.email || '',
    role: s.role || 'Staff',
    initial: s.initial || (s.name ? s.name.charAt(0).toUpperCase() : '?'),
  }));
}

function normalizeCategories(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(c => (typeof c === 'string'
    ? { id: c, name: c }
    : { id: c.id, name: c.name || '' }));
}

function normalizeSettings(raw) {
  if (!raw) return null;
  return {
    branchName: raw.branchName || raw.name || '—',
    hourlyRate: raw.hourlyRate
      ? (typeof raw.hourlyRate === 'number' ? `${raw.hourlyRate} EGP / hour` : raw.hourlyRate)
      : '—',
    taxRate: raw.taxRate
      ? (typeof raw.taxRate === 'number' ? `${raw.taxRate}%` : raw.taxRate)
      : '—',
    singleHourlyRate: Number(raw.singleHourlyRate ?? 0),
    multiHourlyRate: Number(raw.multiHourlyRate ?? 0),
    taxRateValue: Number(raw.taxRateValue ?? 0),
  };
}

function getModalConfig(modal, categories, settings) {
  const record = modal.record || {};
  const categoryOptions = (categories || []).map((c) => ({ value: String(c.id), label: c.name }));
  switch (modal.kind) {
    case "room-add":
      return { title: "Add Room", fields: [{ name: "name", label: "Room name", required: true }] };
    case "room-edit":
      return {
        title: "Rename Room",
        fields: [{ name: "name", label: "Room name", required: true }],
        initial: { name: record.name || "" },
      };
    case "customer-add":
      return {
        title: "Add Customer",
        fields: [
          { name: "name", label: "Name", required: true },
          { name: "email", label: "Email", type: "email" },
          { name: "phone", label: "Phone" },
        ],
      };
    case "customer-edit":
      return {
        title: "Edit Customer",
        fields: [
          { name: "name", label: "Name", required: true },
          { name: "email", label: "Email", type: "email" },
          { name: "phone", label: "Phone" },
        ],
        initial: { name: record.name, email: record.email, phone: record.phone },
      };
    case "product-add":
      return {
        title: "Add Product",
        fields: [
          { name: "name", label: "Name", required: true },
          { name: "price", label: "Price", type: "number", required: true },
          { name: "stock", label: "Stock", type: "number" },
          { name: "categoryId", label: "Category", type: "select", options: categoryOptions, required: true },
        ],
      };
    case "product-edit":
      return {
        title: "Edit Product",
        fields: [
          { name: "name", label: "Name", required: true },
          { name: "price", label: "Price", type: "number", required: true },
          { name: "stock", label: "Stock", type: "number" },
          { name: "categoryId", label: "Category", type: "select", options: categoryOptions, required: true },
        ],
        initial: {
          name: record.name,
          price: record.price,
          stock: record.stock,
          categoryId: record.categoryId != null ? String(record.categoryId) : "",
        },
      };
    case "staff-add":
      return {
        title: "Add Staff",
        fields: [
          { name: "name", label: "Name", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "password", label: "Password", type: "password", required: true },
          {
            name: "role",
            label: "Role",
            type: "select",
            options: [
              { value: "Staff", label: "Staff" },
              { value: "Admin", label: "Admin" },
            ],
          },
        ],
        initial: { role: "Staff" },
      };
    case "staff-edit":
      return {
        title: "Edit Staff",
        fields: [
          { name: "name", label: "Name", required: true },
          {
            name: "role",
            label: "Role",
            type: "select",
            options: [
              { value: "Staff", label: "Staff" },
              { value: "Admin", label: "Admin" },
            ],
          },
        ],
        initial: { name: record.name, role: record.role || "Staff" },
      };
    case "category-add":
      return { title: "Add Category", fields: [{ name: "name", label: "Name", required: true }] };
    case "settings":
      return {
        title: "Edit Settings",
        fields: [
          { name: "branchName", label: "Branch name", required: true },
          { name: "singleHourlyRate", label: "Single hourly rate", type: "number", required: true },
          { name: "multiHourlyRate", label: "Multi hourly rate", type: "number", required: true },
          { name: "taxPercent", label: "Tax %", type: "number", required: true },
        ],
        initial: {
          branchName: settings?.branchName === "—" ? "" : (settings?.branchName || ""),
          singleHourlyRate: settings?.singleHourlyRate ?? "",
          multiHourlyRate: settings?.multiHourlyRate ?? "",
          taxPercent: settings?.taxRateValue != null ? settings.taxRateValue * 100 : "",
        },
      };
    case "order-status":
      return {
        title: `Order #${record.id}`,
        submitLabel: "Update",
        fields: [{
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { value: "PREPARING", label: "PREPARING" },
            { value: "READY", label: "READY" },
            { value: "DELIVERED", label: "DELIVERED" },
          ],
        }],
        initial: { status: record.status === "NEW" ? "PREPARING" : (record.status || "READY") },
      };
    default:
      return null;
  }
}

const FormModal = ({ title, fields, initial, onSubmit, onClose, busy, submitLabel }) => {
  const [form, setForm] = useState(() => {
    const next = {};
    for (const field of fields) {
      next[field.name] = initial?.[field.name] ?? field.defaultValue ?? "";
    }
    return next;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form
        className="w-full max-w-md bg-[#0c0f17] border border-gray-800 rounded-[24px] p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-white font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        {fields.map((field) => (
          <label key={field.name} className="block space-y-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase">{field.label}</span>
            {field.type === "select" ? (
              <select
                required={field.required}
                value={form[field.name] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                className="w-full bg-[#111622] border border-gray-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select...</option>
                {(field.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                required={field.required}
                value={form[field.name] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                className="w-full bg-[#111622] border border-gray-800 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            )}
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-[#1e40af] text-white text-xs font-bold disabled:opacity-50"
          >
            {busy ? "Saving..." : (submitLabel || "Save")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CyberCafeDashboard;