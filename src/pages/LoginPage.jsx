import React, { useState } from "react";
import { Gamepad2, LogIn, AlertCircle } from "lucide-react";
import { api, getUser } from "../api";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = await api.login(email, password);
      // auth = { token, user: { role, branchId, ... } }

      // وجّه حسب الدور
      const role = auth?.user?.role?.toLowerCase();
      if (role === "admin") navigate("/");
      else if (role === "staff") navigate("/staff");
      else navigate("/");
    } catch (err) {
      setError(err.message || "بيانات الدخول غلط");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#0c0f17] border border-white/5 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/40 mb-4">
            <Gamepad2 className="text-white" size={28} />
          </div>
          <h1 className="text-white font-black text-2xl uppercase tracking-tight">Atari PlayStation</h1>
          <p className="text-gray-500 text-sm mt-1">تسجيل الدخول للنظام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-bold block mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white focus:border-blue-600 outline-none transition-colors"
              placeholder="admin@atari.com"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-bold block mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white focus:border-blue-600 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-900/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            <LogIn size={18} />
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}