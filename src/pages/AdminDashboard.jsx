import React, { useState, useEffect } from 'react';
import {
  Activity, LayoutDashboard, DoorOpen, ShoppingCart, Timer, Users,
  Package, BarChart3, UserCog, Layers, Settings, Menu, Bell,
  ChevronDown, CreditCard, X, Edit, Trash2, Plus, Search
} from 'lucide-react';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis,
  Tooltip, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const CyberCafeDashboard = () => {
  const branches = [
    { id: 'main', name: 'Main Branch' },
    { id: 'north', name: 'North Branch' },
    { id: 'south', name: 'South Branch' },
  ];

  const [selectedBranch, setSelectedBranch] = useState('main');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  // Detect screen size for sidebar behavior
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Full branch data for all sections
  const branchData = {
    main: {
      stats: [
        { label: "Total Revenue", value: "2,450", diff: "+12.5%", color: "#10b981", icon: <CreditCard />, bg: "rgba(16,185,129,0.1)" },
        { label: "Total Orders", value: "18", diff: "+8.3%", color: "#8b5cf6", icon: <ShoppingCart />, bg: "rgba(139,92,246,0.1)" },
        { label: "Active Sessions", value: "12", diff: "+5.7%", color: "#f59e0b", icon: <Timer />, bg: "rgba(245,158,11,0.1)" },
        { label: "Total Customers", value: "32", diff: "+9.1%", color: "#3b82f6", icon: <Users />, bg: "rgba(59,130,246,0.1)" },
      ],
      revenueData: [
        { day: 'Sun', rev: 1200 }, { day: 'Mon', rev: 1800 }, { day: 'Tue', rev: 2450 },
        { day: 'Wed', rev: 1900 }, { day: 'Thu', rev: 2100 }, { day: 'Fri', rev: 2800 }, { day: 'Sat', rev: 2300 }
      ],
      pieData: [
        { name: 'Cash', value: 1650, color: '#10b981' },
        { name: 'Card', value: 600, color: '#6366f1' },
        { name: 'Online', value: 200, color: '#3b82f6' },
      ],
      rooms: [
        { id: 1, status: 'Occupied', user: 'Ahmed Samir', time: '01:25:30', price: '85 EGP' },
        { id: 2, status: 'Available', user: '-', time: '-', price: '-' },
        { id: 3, status: 'Occupied', user: 'Mazen Ashraf', time: '00:45:10', price: '60 EGP' },
        { id: 4, status: 'Available', user: '-', time: '-', price: '-' },
        { id: 5, status: 'Occupied', user: 'Youssef Tarek', time: '02:15:45', price: '125 EGP' },
        { id: 6, status: 'Available', user: '-', time: '-', price: '-' },
        { id: 7, status: 'Occupied', user: 'Karim Mohamed', time: '01:10:20', price: '95 EGP' },
        { id: 8, status: 'Available', user: '-', time: '-', price: '-' },
      ],
      orders: [
        { id: 101, room: 3, items: "2 x Coffee", time: "2 min ago", status: "NEW", color: "#ef4444", emoji: "☕", amount: 60 },
        { id: 102, room: 1, items: "1 x Pepsi", time: "4 min ago", status: "PREPARING", color: "#f59e0b", emoji: "🥤", amount: 25 },
        { id: 103, room: 5, items: "1 x Tea", time: "6 min ago", status: "READY", color: "#10b981", emoji: "🍵", amount: 20 },
        { id: 104, room: 7, items: "2 x Water", time: "10 min ago", status: "DELIVERED", color: "#3b82f6", emoji: "💧", amount: 30 },
      ],
      sessions: [
        { room: 1, started: "2 hours ago", duration: "01:25:30" },
        { room: 3, started: "1 hour ago", duration: "00:45:10" },
        { room: 5, started: "3 hours ago", duration: "02:15:45" },
        { room: 7, started: "1.5 hours ago", duration: "01:10:20" },
      ],
      customers: [
        { name: 'Ahmed Samir', email: 'ahmed.samir@example.com', phone: '+20 101 234 567', spent: 1250 },
        { name: 'Mazen Ashraf', email: 'mazen.ashraf@example.com', phone: '+20 102 345 678', spent: 870 },
        { name: 'Youssef Tarek', email: 'youssef.tarek@example.com', phone: '+20 103 456 789', spent: 2100 },
        { name: 'Karim Mohamed', email: 'karim.mohamed@example.com', phone: '+20 104 567 890', spent: 540 },
      ],
      products: [
        { name: 'Coffee', price: 15, stock: 45 },
        { name: 'Pepsi', price: 12, stock: 32 },
        { name: 'Tea', price: 10, stock: 28 },
        { name: 'Water', price: 8, stock: 50 },
        { name: 'Sandwich', price: 35, stock: 20 },
        { name: 'Cake', price: 25, stock: 15 },
      ],
      topProducts: [
        { label: 'Coffee', val: 45, max: 50, emoji: '☕', color: '#6366f1' },
        { label: 'Pepsi', val: 32, max: 50, emoji: '🥤', color: '#6366f1' },
        { label: 'Tea', val: 28, max: 50, emoji: '🍵', color: '#6366f1' },
        { label: 'Water', val: 20, max: 50, emoji: '💧', color: '#6366f1' },
      ],
      staff: [
        { name: 'John Doe', role: 'Admin', initial: 'J' },
        { name: 'Jane Smith', role: 'Staff', initial: 'J' },
        { name: 'Mike Johnson', role: 'Staff', initial: 'M' },
        { name: 'Sarah Lee', role: 'Admin', initial: 'S' },
      ],
      categories: ['Beverages', 'Snacks', 'Meals', 'Desserts'],
      settings: {
        branchName: 'Main Branch',
        hourlyRate: '15 EGP / hour',
        taxRate: '14%'
      }
    },
    north: {
      stats: [
        { label: "Total Revenue", value: "1,890", diff: "+8.2%", color: "#10b981", icon: <CreditCard />, bg: "rgba(16,185,129,0.1)" },
        { label: "Total Orders", value: "14", diff: "+4.1%", color: "#8b5cf6", icon: <ShoppingCart />, bg: "rgba(139,92,246,0.1)" },
        { label: "Active Sessions", value: "8", diff: "+2.3%", color: "#f59e0b", icon: <Timer />, bg: "rgba(245,158,11,0.1)" },
        { label: "Total Customers", value: "21", diff: "+6.4%", color: "#3b82f6", icon: <Users />, bg: "rgba(59,130,246,0.1)" },
      ],
      revenueData: [
        { day: 'Sun', rev: 900 }, { day: 'Mon', rev: 1400 }, { day: 'Tue', rev: 1890 },
        { day: 'Wed', rev: 1500 }, { day: 'Thu', rev: 1700 }, { day: 'Fri', rev: 2100 }, { day: 'Sat', rev: 1900 }
      ],
      pieData: [
        { name: 'Cash', value: 1100, color: '#10b981' },
        { name: 'Card', value: 500, color: '#6366f1' },
        { name: 'Online', value: 290, color: '#3b82f6' },
      ],
      rooms: [
        { id: 1, status: 'Occupied', user: 'Nourhan Ali', time: '02:10:15', price: '110 EGP' },
        { id: 2, status: 'Available', user: '-', time: '-', price: '-' },
        { id: 3, status: 'Occupied', user: 'Mahmoud Hany', time: '00:35:20', price: '40 EGP' },
        { id: 4, status: 'Available', user: '-', time: '-', price: '-' },
        { id: 5, status: 'Occupied', user: 'Rana Khaled', time: '01:50:30', price: '95 EGP' },
        { id: 6, status: 'Available', user: '-', time: '-', price: '-' },
        { id: 7, status: 'Occupied', user: 'Omar Hesham', time: '00:55:10', price: '55 EGP' },
        { id: 8, status: 'Available', user: '-', time: '-', price: '-' },
      ],
      orders: [
        { id: 201, room: 1, items: "1 x Coffee, 1 x Cake", time: "5 min ago", status: "NEW", color: "#ef4444", emoji: "☕", amount: 55 },
        { id: 202, room: 3, items: "2 x Water", time: "8 min ago", status: "PREPARING", color: "#f59e0b", emoji: "💧", amount: 16 },
        { id: 203, room: 5, items: "1 x Sandwich", time: "12 min ago", status: "READY", color: "#10b981", emoji: "🥪", amount: 35 },
        { id: 204, room: 7, items: "1 x Pepsi", time: "15 min ago", status: "DELIVERED", color: "#3b82f6", emoji: "🥤", amount: 12 },
      ],
      sessions: [
        { room: 1, started: "2.5 hours ago", duration: "02:10:15" },
        { room: 3, started: "45 min ago", duration: "00:35:20" },
        { room: 5, started: "2 hours ago", duration: "01:50:30" },
        { room: 7, started: "1 hour ago", duration: "00:55:10" },
      ],
      customers: [
        { name: 'Nourhan Ali', email: 'nourhan.ali@example.com', phone: '+20 111 222 333', spent: 980 },
        { name: 'Mahmoud Hany', email: 'mahmoud.hany@example.com', phone: '+20 112 233 444', spent: 420 },
        { name: 'Rana Khaled', email: 'rana.khaled@example.com', phone: '+20 113 344 555', spent: 1500 },
        { name: 'Omar Hesham', email: 'omar.hesham@example.com', phone: '+20 114 455 666', spent: 310 },
      ],
      products: [
        { name: 'Coffee', price: 15, stock: 30 },
        { name: 'Pepsi', price: 12, stock: 25 },
        { name: 'Tea', price: 10, stock: 20 },
        { name: 'Water', price: 8, stock: 40 },
        { name: 'Sandwich', price: 35, stock: 12 },
        { name: 'Cake', price: 25, stock: 18 },
      ],
      topProducts: [
        { label: 'Coffee', val: 30, max: 50, emoji: '☕', color: '#6366f1' },
        { label: 'Pepsi', val: 25, max: 50, emoji: '🥤', color: '#6366f1' },
        { label: 'Tea', val: 20, max: 50, emoji: '🍵', color: '#6366f1' },
        { label: 'Water', val: 18, max: 50, emoji: '💧', color: '#6366f1' },
      ],
      staff: [
        { name: 'Hossam Eldin', role: 'Admin', initial: 'H' },
        { name: 'Mona Gamal', role: 'Staff', initial: 'M' },
        { name: 'Karim Waleed', role: 'Staff', initial: 'K' },
      ],
      categories: ['Beverages', 'Snacks', 'Meals'],
      settings: {
        branchName: 'North Branch',
        hourlyRate: '14 EGP / hour',
        taxRate: '14%'
      }
    },
    south: {
      stats: [
        { label: "Total Revenue", value: "3,120", diff: "+15.2%", color: "#10b981", icon: <CreditCard />, bg: "rgba(16,185,129,0.1)" },
        { label: "Total Orders", value: "23", diff: "+11.4%", color: "#8b5cf6", icon: <ShoppingCart />, bg: "rgba(139,92,246,0.1)" },
        { label: "Active Sessions", value: "15", diff: "+9.8%", color: "#f59e0b", icon: <Timer />, bg: "rgba(245,158,11,0.1)" },
        { label: "Total Customers", value: "45", diff: "+13.5%", color: "#3b82f6", icon: <Users />, bg: "rgba(59,130,246,0.1)" },
      ],
      revenueData: [
        { day: 'Sun', rev: 1500 }, { day: 'Mon', rev: 2100 }, { day: 'Tue', rev: 3120 },
        { day: 'Wed', rev: 2700 }, { day: 'Thu', rev: 2900 }, { day: 'Fri', rev: 3500 }, { day: 'Sat', rev: 3100 }
      ],
      pieData: [
        { name: 'Cash', value: 2100, color: '#10b981' },
        { name: 'Card', value: 720, color: '#6366f1' },
        { name: 'Online', value: 300, color: '#3b82f6' },
      ],
      rooms: [
        { id: 1, status: 'Occupied', user: 'Laila Ezz', time: '03:20:00', price: '170 EGP' },
        { id: 2, status: 'Occupied', user: 'Mohamed Salah', time: '01:55:30', price: '105 EGP' },
        { id: 3, status: 'Available', user: '-', time: '-', price: '-' },
        { id: 4, status: 'Occupied', user: 'Yasmin Adel', time: '00:30:15', price: '50 EGP' },
        { id: 5, status: 'Available', user: '-', time: '-', price: '-' },
        { id: 6, status: 'Occupied', user: 'Tamer Hosny', time: '02:40:20', price: '145 EGP' },
        { id: 7, status: 'Available', user: '-', time: '-', price: '-' },
        { id: 8, status: 'Occupied', user: 'Sohair Elbably', time: '01:05:45', price: '85 EGP' },
      ],
      orders: [
        { id: 301, room: 1, items: "2 x Coffee, 1 x Sandwich", time: "3 min ago", status: "NEW", color: "#ef4444", emoji: "☕", amount: 95 },
        { id: 302, room: 2, items: "1 x Pepsi, 1 x Cake", time: "7 min ago", status: "PREPARING", color: "#f59e0b", emoji: "🥤", amount: 47 },
        { id: 303, room: 4, items: "1 x Tea", time: "9 min ago", status: "READY", color: "#10b981", emoji: "🍵", amount: 20 },
        { id: 304, room: 6, items: "3 x Water", time: "14 min ago", status: "DELIVERED", color: "#3b82f6", emoji: "💧", amount: 24 },
        { id: 305, room: 8, items: "1 x Coffee", time: "18 min ago", status: "DELIVERED", color: "#3b82f6", emoji: "☕", amount: 15 },
      ],
      sessions: [
        { room: 1, started: "3.5 hours ago", duration: "03:20:00" },
        { room: 2, started: "2 hours ago", duration: "01:55:30" },
        { room: 4, started: "35 min ago", duration: "00:30:15" },
        { room: 6, started: "3 hours ago", duration: "02:40:20" },
        { room: 8, started: "1.2 hours ago", duration: "01:05:45" },
      ],
      customers: [
        { name: 'Laila Ezz', email: 'laila.ezz@example.com', phone: '+20 121 345 678', spent: 2200 },
        { name: 'Mohamed Salah', email: 'mohamed.salah@example.com', phone: '+20 122 456 789', spent: 1350 },
        { name: 'Yasmin Adel', email: 'yasmin.adel@example.com', phone: '+20 123 567 890', spent: 890 },
        { name: 'Tamer Hosny', email: 'tamer.hosny@example.com', phone: '+20 124 678 901', spent: 1750 },
        { name: 'Sohair Elbably', email: 'sohair.elbably@example.com', phone: '+20 125 789 012', spent: 620 },
      ],
      products: [
        { name: 'Coffee', price: 15, stock: 55 },
        { name: 'Pepsi', price: 12, stock: 48 },
        { name: 'Tea', price: 10, stock: 35 },
        { name: 'Water', price: 8, stock: 60 },
        { name: 'Sandwich', price: 35, stock: 28 },
        { name: 'Cake', price: 25, stock: 22 },
      ],
      topProducts: [
        { label: 'Coffee', val: 55, max: 60, emoji: '☕', color: '#6366f1' },
        { label: 'Pepsi', val: 48, max: 60, emoji: '🥤', color: '#6366f1' },
        { label: 'Tea', val: 35, max: 60, emoji: '🍵', color: '#6366f1' },
        { label: 'Water', val: 30, max: 60, emoji: '💧', color: '#6366f1' },
      ],
      staff: [
        { name: 'Samira Ahmed', role: 'Admin', initial: 'S' },
        { name: 'Amr Diab', role: 'Staff', initial: 'A' },
        { name: 'Hend Sabry', role: 'Staff', initial: 'H' },
        { name: 'Khaled El Sawy', role: 'Admin', initial: 'K' },
      ],
      categories: ['Beverages', 'Snacks', 'Meals', 'Desserts', 'Breakfast'],
      settings: {
        branchName: 'South Branch',
        hourlyRate: '16 EGP / hour',
        taxRate: '14%'
      }
    },
  };

  const data = branchData[selectedBranch] || branchData.main;

  // Function to render content based on activeView, passing branch-specific data
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardContent data={data} />;
      case 'rooms':
        return <RoomsContent rooms={data.rooms} />;
      case 'orders':
        return <OrdersContent orders={data.orders} />;
      case 'sessions':
        return <SessionsContent sessions={data.sessions} />;
      case 'customers':
        return <CustomersContent customers={data.customers} />;
      case 'products':
        return <ProductsContent products={data.products} />;
      case 'reports':
        return <ReportsContent revenueData={data.revenueData} pieData={data.pieData} topProducts={data.topProducts} />;
      case 'staff':
        return <StaffContent staff={data.staff} />;
      case 'categories':
        return <CategoriesContent categories={data.categories} />;
      case 'settings':
        return <SettingsContent settings={data.settings} />;
      default:
        return <DashboardContent data={data} />;
    }
  };

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
                badge={data.orders.length.toString()} 
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

          {/* Today's Overview Sidebar Card */}
          <div className="hidden sm:block bg-[#111622] rounded-2xl p-4 border border-gray-800/50">
             <p className="text-[10px] text-gray-500 font-medium">Today's Overview</p>
             <p className="text-[11px] mt-3 text-gray-300">Total Revenue</p>
             <p className="text-xl font-bold text-[#10b981] mt-0.5">{data.stats[0].value} <span className="text-[10px] font-medium text-gray-500">EGP</span></p>
             <p className="text-[10px] text-[#10b981] mt-1 font-bold">{data.stats[0].diff} <span className="text-gray-600 font-normal">from yesterday</span></p>
             <div className="h-12 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueData}>
                    <Line type="monotone" dataKey="rev" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
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
              <h2 className="text-white text-sm font-semibold flex items-center gap-2">Welcome back, Admin 👋</h2>
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
                <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-[#07090d]">5</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden xs:block">
                  <p className="text-xs font-bold text-white leading-none">Admin</p>
                  <p className="text-[10px] text-gray-500 mt-1">Super Admin</p>
                </div>
                <img src="https://i.pravatar.cc/150?u=admin" className="w-9 h-9 rounded-xl border border-gray-700 shadow-xl" alt="profile" />
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 md:px-8 py-6">
          {/* Date Selector */}
          <div className="flex justify-end mb-6">
            <div className="bg-[#111622] text-[11px] font-bold text-gray-400 px-4 py-2 rounded-xl border border-gray-800 flex items-center gap-2 cursor-pointer hover:border-gray-600 transition-all">
              <Activity size={14} className="text-blue-500" /> Today, 18 May 2024 <ChevronDown size={14} />
            </div>
          </div>

          {/* Dynamic Content */}
          {renderContent()}
          
        </div>
      </main>
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
    {badge && <span className="bg-[#6366f1] text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg">{badge}</span>}
  </div>
);

// ---------------------- DASHBOARD CONTENT ----------------------
const DashboardContent = ({ data }) => (
  <>
    {/* Stats Cards Row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {data.stats.map((s, i) => (
        <div key={i} className="bg-[#0c0f17] border border-gray-800/60 rounded-[24px] p-4 md:p-5 relative overflow-hidden group hover:border-gray-700 transition-all">
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }}></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-2 rounded-xl border border-gray-800" style={{ backgroundColor: s.bg, color: s.color }}>
              {React.cloneElement(s.icon, { size: 20 })}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{s.label}</p>
              <p className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight">{s.value} <span className="text-[11px] text-gray-500 font-medium">EGP</span></p>
              <p className="text-[10px] mt-1.5 font-bold" style={{ color: s.color }}>{s.diff} <span className="text-gray-600 font-medium ml-1">from yesterday</span></p>
            </div>
          </div>
          <div className="mt-4 h-8 opacity-40 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueData}>
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
          {data.rooms.map(room => (
            <div key={room.id} className={`p-3 md:p-4 rounded-[20px] border transition-all hover:scale-[1.02] ${room.status === 'Occupied' ? 'bg-[#ef4444]/[0.03] border-[#ef4444]/20' : 'bg-[#10b981]/[0.03] border-[#10b981]/20'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className={`p-1.5 rounded-lg ${room.status === 'Occupied' ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-[#10b981]/10 text-[#10b981]'}`}>
                  <Activity size={14} />
                </div>
                <span className={`text-[11px] font-black uppercase ${room.status === 'Occupied' ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>Room {room.id}</span>
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
        <button className="w-full mt-7 py-3 bg-[#111622] rounded-2xl text-[11px] font-bold text-gray-400 border border-gray-800 hover:bg-gray-800 hover:text-white transition-all tracking-wide">View All Rooms</button>
      </div>

      <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-white font-bold text-[15px]">Live Orders</h3>
          <span className="text-[11px] font-bold text-blue-500 cursor-pointer hover:underline">View All</span>
        </div>
        <div className="space-y-7 flex-1">
          {data.orders.slice(0, 4).map(order => (
            <OrderItem key={order.id} room={order.room} items={order.items} time={order.time} status={order.status} color={order.color} emoji={order.emoji} />
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
          {data.topProducts.map((prod, idx) => (
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
            <AreaChart data={data.revenueData}>
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
                <Pie data={data.pieData} innerRadius={35} outerRadius={50} paddingAngle={8} dataKey="value">
                  {data.pieData.map((entry, index) => (
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
            {data.pieData.map((item, i) => {
              const total = data.pieData.reduce((sum, curr) => sum + curr.value, 0);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                  <div>
                    <p className="text-[10px] text-white font-bold leading-none">{item.name}</p>
                    <p className="text-[8px] text-gray-500 mt-1">{item.value} EGP ({Math.round(item.value/total*100)}%)</p>
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
const RoomsContent = ({ rooms }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h3 className="text-white font-bold text-lg">Manage Rooms</h3>
      <button className="flex items-center gap-2 bg-[#1e40af] hover:bg-blue-800 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all">
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
              <td className="py-3 text-sm font-bold text-white">Room {room.id}</td>
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
                  <button className="p-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><Edit size={14} /></button>
                  <button className="p-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={14} /></button>
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
const OrdersContent = ({ orders }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h3 className="text-white font-bold text-lg">All Orders</h3>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        <input type="text" placeholder="Search orders..." className="bg-[#111622] border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
      </div>
    </div>
    <div className="space-y-4">
      {orders.map(order => (
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
            <button className="text-blue-400 text-xs font-bold hover:underline">View</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------- SESSIONS PAGE ----------------------
const SessionsContent = ({ sessions }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <h3 className="text-white font-bold text-lg mb-6">Active Sessions</h3>
    <div className="grid gap-4">
      {sessions.map((session, idx) => (
        <div key={idx} className="flex flex-wrap items-center justify-between p-4 bg-[#111622] rounded-2xl border border-gray-800/50">
          <div>
            <p className="text-white font-bold">Room {session.room}</p>
            <p className="text-[10px] text-gray-500">Started {session.started}</p>
          </div>
          <div className="flex items-center gap-4">
            <Timer size={16} className="text-[#f59e0b]" />
            <span className="text-sm text-white">{session.duration}</span>
            <button className="bg-red-500/20 text-red-400 text-xs font-bold py-1 px-3 rounded-lg">End Session</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------- CUSTOMERS PAGE ----------------------
const CustomersContent = ({ customers }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
      <h3 className="text-white font-bold text-lg">Customers List</h3>
      <button className="flex items-center gap-2 bg-[#1e40af] hover:bg-blue-800 text-white text-xs font-bold py-2 px-4 rounded-xl"><Plus size={14} /> Add Customer</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-gray-800">
          <tr>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Name</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Email</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Phone</th>
            <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase">Total Spent</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, idx) => (
            <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20">
              <td className="py-3 text-sm text-white">{customer.name}</td>
              <td className="py-3 text-sm text-gray-400">{customer.email}</td>
              <td className="py-3 text-sm text-gray-400">{customer.phone}</td>
              <td className="py-3 text-sm text-[#10b981] font-bold">{customer.spent} EGP</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ---------------------- PRODUCTS PAGE ----------------------
const ProductsContent = ({ products }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-white font-bold text-lg">Products Inventory</h3>
      <button className="flex items-center gap-2 bg-[#1e40af] text-white text-xs font-bold py-2 px-4 rounded-xl"><Plus size={14} /> Add Product</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((prod, idx) => (
        <div key={idx} className="bg-[#111622] rounded-2xl p-4 border border-gray-800/50 flex justify-between items-center">
          <div>
            <p className="text-white font-bold">{prod.name}</p>
            <p className="text-[10px] text-gray-500">Price: {prod.price} EGP</p>
            <p className="text-[9px] text-gray-600">Stock: {prod.stock}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Edit size={14} /></button>
            <button className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><Trash2 size={14} /></button>
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
const StaffContent = ({ staff }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-white font-bold text-lg">Staff Management</h3>
      <button className="flex items-center gap-2 bg-[#1e40af] text-white text-xs font-bold py-2 px-4 rounded-xl"><Plus size={14} /> Add Staff</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {staff.map((member, idx) => (
        <div key={idx} className="bg-[#111622] rounded-2xl p-4 border border-gray-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">{member.initial}</div>
            <div>
              <p className="text-white font-bold">{member.name}</p>
              <p className="text-[10px] text-gray-500">Role: {member.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Edit size={14} /></button>
            <button className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------- CATEGORIES PAGE ----------------------
const CategoriesContent = ({ categories }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-white font-bold text-lg">Product Categories</h3>
      <button className="flex items-center gap-2 bg-[#1e40af] text-white text-xs font-bold py-2 px-4 rounded-xl"><Plus size={14} /> Add Category</button>
    </div>
    <div className="flex flex-wrap gap-3">
      {categories.map((cat, idx) => (
        <div key={idx} className="bg-[#111622] rounded-2xl px-4 py-2 border border-gray-800/50 flex items-center gap-3">
          <span className="text-white font-medium">{cat}</span>
          <button className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------- SETTINGS PAGE ----------------------
const SettingsContent = ({ settings }) => (
  <div className="bg-[#0c0f17] rounded-[28px] p-5 md:p-7 border border-gray-800/40">
    <h3 className="text-white font-bold text-lg mb-6">System Settings</h3>
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111622] rounded-2xl">
        <div><p className="text-white font-medium">Branch Name</p><p className="text-[10px] text-gray-500">{settings.branchName}</p></div>
        <button className="text-blue-400 text-xs font-bold">Edit</button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111622] rounded-2xl">
        <div><p className="text-white font-medium">Hourly Rate</p><p className="text-[10px] text-gray-500">{settings.hourlyRate}</p></div>
        <button className="text-blue-400 text-xs font-bold">Edit</button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111622] rounded-2xl">
        <div><p className="text-white font-medium">Tax Rate</p><p className="text-[10px] text-gray-500">{settings.taxRate}</p></div>
        <button className="text-blue-400 text-xs font-bold">Edit</button>
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
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(val/max)*100}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}></div>
      </div>
    </div>
  </div>
);

export default CyberCafeDashboard;