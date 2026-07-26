'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 border-b border-emerald-900/30 bg-slate-900/90 text-white backdrop-blur-md transition-all duration-300 ${
        scrolled ? 'translate-y-0 opacity-100 shadow-xl py-2.5' : '-translate-y-full opacity-0 pointer-events-none py-2'
      }`}
    >
      <div className="px-4 flex items-center justify-between">
        <Link href="/" className="transition-transform duration-300 hover:scale-105 flex items-center">
          <Image
            src="/logo.png"
            alt="Mamafarm Logo"
            width={180}
            height={70}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <Link
          href="/dashboard"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1"
        >
          <span>Dashboard</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;

