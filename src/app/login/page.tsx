'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { authAPI } from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { showSuccess, showError } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authAPI.login(mobile, password);
      const token = res.data?.token || (res as any)?.token;
      if (res.success && token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('mamafarm_token', token);
        }
        showSuccess('Login successful! Redirecting...');
        router.push('/dashboard/sales');
      } else {
        const errMsg = res.message || 'Invalid mobile number or password';
        setError(errMsg);
        showError(errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Authentication failed';
      setError(errMsg);
      showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11180d] text-[#FEFEFE] flex items-center justify-center p-4 relative antialiased">
      {/* Ambient Brand Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[320px] h-[320px] bg-[#283C06]/30 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-sm bg-[#162111]/95 border border-[#283C06]/60 rounded-3xl p-6 shadow-2xl relative z-10 backdrop-blur-xl space-y-5">
        {/* App Header & Brand Logo */}
        <div className="text-center space-y-2.5">
          <div className="w-20 h-20 rounded-2xl bg-[#FEFEFE] p-1 mx-auto flex items-center justify-center shadow-2xl shadow-[#283C06]/40 border border-[#8B7E2A]/40">
            <img src="/logo.png" alt="MamaFarm Origin Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-[10px] text-[#8B7E2A] font-semibold italic mt-0.5">Pure Ingredients. True Goodness.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs p-3 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Mobile Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#8B7E2A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full bg-[#1e2a16] border border-[#283C06]/60 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#FEFEFE] placeholder:text-slate-500 focus:outline-none focus:border-[#8B7E2A] transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8B7E2A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#1e2a16] border border-[#283C06]/60 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#FEFEFE] focus:outline-none focus:border-[#8B7E2A] transition-all"
                required
              />
            </div>
          </div>

          {/* CTA Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#283C06] to-[#8B7E2A] hover:opacity-95 text-[#FEFEFE] font-extrabold text-xs rounded-xl shadow-lg shadow-[#283C06]/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-[#8B7E2A]/40"
          >
            {loading ? 'Logging in...' : 'Login to Tracker'}
            <ArrowRight className="w-4 h-4 text-[#8B7E2A]" />
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-500 pt-1">
          MamaFarm Organic Sprouts Operational Tracker
        </div>
      </div>
    </div>
  );
}
