import Image from 'next/image';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, Phone } from 'lucide-react';

export default function Hero() {
  return (
    <section className="w-full relative bg-slate-900 pt-5 pb-8 px-4 border-b border-emerald-900/30 text-white">
      {/* Top Header Bar inside Hero */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Mamafarm"
            width={160}
            height={60}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <Link
          href="/dashboard"
          className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tracker App</span>
        </Link>
      </div>

      {/* Banner Image Display */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-800/40 shadow-2xl mb-5 group">
        <Image
          src="/images/sprouts-banner.png"
          alt="MamaFarm Organic Sprouts Banner"
          width={1080}
          height={600}
          priority
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-4">
          <div className="inline-block px-2.5 py-0.5 bg-emerald-500/30 backdrop-blur-md text-emerald-300 rounded-full text-[10px] font-bold tracking-wider uppercase mb-1.5 border border-emerald-400/30 self-start">
            🌱 100% Organic Sprouts
          </div>
          <p className="text-white text-xs font-semibold drop-shadow-md">
            Daily Fresh Moong, Chana & Mixed Sprouts
          </p>
        </div>
      </div>

      {/* Mobile Sprouts Action Card */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-800/40 shadow-xl bg-gradient-to-b from-emerald-950/40 to-slate-900 p-4 mb-5 text-center">
        <h1 className="text-xl font-black text-white leading-tight mb-2 tracking-tight">
          Pure Organic Sprouts <br />
          <span className="text-emerald-400 font-serif italic font-normal">Delivered Fresh Daily</span>
        </h1>

        <p className="text-slate-300 text-xs leading-relaxed mb-4 max-w-xs mx-auto">
          Nutrient-dense Moong, Chana & Mixed Sprouts grown using pure filtered water. High protein superfood for a healthier life!
        </p>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3 justify-center">
          <a
            href="https://wa.me/918130188878?text=Hello%20MamaFarm!%20I%20want%20to%20order%20fresh%20Organic%20Sprouts."
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Sprouts</span>
          </a>

          <a
            href="tel:8130188878"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call</span>
          </a>
        </div>
      </div>

      {/* Feature highlights badge row */}
      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <span className="block font-bold text-emerald-400">100% Organic</span>
          <span className="text-slate-400 text-[9px]">Chemical-Free</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <span className="block font-bold text-emerald-400">Filtered Water</span>
          <span className="text-slate-400 text-[9px]">Hygienic Soak</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <span className="block font-bold text-emerald-400">Daily Dispatch</span>
          <span className="text-slate-400 text-[9px]">Shops & Homes</span>
        </div>
      </div>
    </section>
  );
}


