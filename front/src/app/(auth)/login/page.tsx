'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, user } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email, password);
      router.push('/');
    } catch (e: any) {
      setErrorMsg(e.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const pass = quickEmail === 'admin' ? 'admin123' : 'password';
      await login(quickEmail, pass);
      router.push('/');
    } catch (e: any) {
      setErrorMsg(e.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100 h-full w-full p-4 select-none relative overflow-hidden">

      {/* Import ENOCH Font */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.cdnfonts.com/css/enoch');
      `}} />

      {/* Soft Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-300/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-[850px] bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] flex gap-8 z-10 transition-all duration-300">

        {/* Left Side: Brand info */}
        <div className="w-1/2 flex flex-col justify-between border-r border-gray-150 pr-8">
          <div>
            <div className="mb-4">
              <div>
                <h1 className="text-5xl font-bold tracking-tight text-gray-900 leading-none" style={{ fontFamily: "'ENOCH', sans-serif" }}>
                  JIG FIXTURES
                </h1>
                <p className="text-[13px] text-gray-500 font-bold tracking-wide mt-2" style={{ fontFamily: "'Product Sans', 'Inter', sans-serif" }}>
                  Management
                </p>
              </div>
            </div>
          </div>

          {/* Quick Login Section */}
          <div className="mt-8">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Login (Testing Shortcut)</h3>
            <div className="grid grid-cols-2 gap-2.5">

              {/* PIC/Admin Card */}
              <div
                onClick={() => handleQuickLogin('admin')}
                className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 cursor-pointer hover:bg-blue-50/50 hover:border-blue-500/50 transition-all duration-200 group shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-green-600">person</span>
                  <span className="text-[10px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Admin (PIC)</span>
                </div>
                <p className="text-[8px] text-gray-500 mt-1">admin / admin123</p>
              </div>

              {/* Sec Head Card */}
              <div
                onClick={() => handleQuickLogin('sec@example.com')}
                className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 cursor-pointer hover:bg-blue-50/50 hover:border-blue-500/50 transition-all duration-200 group shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-yellow-600">badge</span>
                  <span className="text-[10px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Section Head</span>
                </div>
                <p className="text-[8px] text-gray-500 mt-1">sec@example.com</p>
              </div>

              {/* Dept Head Card */}
              <div
                onClick={() => handleQuickLogin('dept@example.com')}
                className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 cursor-pointer hover:bg-blue-50/50 hover:border-blue-500/50 transition-all duration-200 group shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-blue-600">shield_person</span>
                  <span className="text-[10px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Dept Head</span>
                </div>
                <p className="text-[8px] text-gray-500 mt-1">dept@example.com</p>
              </div>

              {/* Guest Card */}
              <div
                onClick={() => handleQuickLogin('guest@example.com')}
                className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 cursor-pointer hover:bg-blue-50/50 hover:border-blue-500/50 transition-all duration-200 group shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-gray-500">visibility</span>
                  <span className="text-[10px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Guest (Visitor)</span>
                </div>
                <p className="text-[8px] text-gray-500 mt-1">guest@example.com</p>
              </div>

            </div>
          </div>

          <div className="text-[10px] text-gray-400 mt-6">
            PE-Machining Digitalization System © 2026
          </div>
        </div>

        {/* Right Side: Credentials Login */}
        <div className="w-1/2 flex flex-col justify-center pl-4">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Sign In</h2>
          <p className="text-xs text-gray-550 mb-6">Enter your authorized email to access your role dashboard.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Username or Email</label>
              <div className="relative flex items-center border border-gray-300 rounded-xl bg-gray-50 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
                <span className="material-symbols-outlined absolute left-3 text-gray-400 text-sm">mail</span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin or email@example.com"
                  className="w-full bg-transparent pl-9 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
              <div className="relative flex items-center border border-gray-300 rounded-xl bg-gray-50 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
                <span className="material-symbols-outlined absolute left-3 text-gray-400 text-sm">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent pl-9 pr-10 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer select-none"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-semibold p-2.5 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
