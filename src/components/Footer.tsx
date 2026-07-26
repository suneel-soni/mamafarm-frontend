import { Facebook, Instagram, Mail, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
	return (
		<footer className='bg-slate-950 text-white border-t border-slate-800 py-8 px-4'>
			<div className='w-full text-center'>
				{/* Logo */}
				<Link href='/' className='inline-block mb-3'>
					<Image src='/logo.png' alt='Mamafarm Sprouts' width={160} height={60} className='mx-auto h-7 w-auto' />
				</Link>

				{/* Tagline */}
				<p className='text-xs font-semibold text-emerald-400'>100% Organic Sprouts • Pure Filtered Water</p>

				<p className='mx-auto mt-2 text-[11px] text-slate-400 max-w-xs leading-relaxed'>
					Daily fresh Moong, Chana & Mixed Sprouts packed hygienically with zero preservatives.
				</p>

				{/* Contact */}
				<div className='mt-4 flex items-center justify-center gap-4 text-xs text-slate-300'>
					<a href='tel:8130188878' className='flex items-center gap-1.5 hover:text-emerald-400 transition-colors'>
						<Phone size={14} className='text-emerald-400' />
						<span>+91 8130188878</span>
					</a>

					<a href='mailto:hello@mamafarm.in' className='flex items-center gap-1.5 hover:text-emerald-400 transition-colors'>
						<Mail size={14} className='text-emerald-400' />
						<span>hello@mamafarm.in</span>
					</a>
				</div>

				{/* Social Links */}
				<div className='mt-4 flex justify-center gap-3'>
					<Link href='https://www.instagram.com/mamafarm_in' target='_blank' rel='noopener noreferrer' className='rounded-full bg-slate-900 border border-slate-700 p-2 text-slate-300 hover:text-emerald-400 hover:border-emerald-500 transition-colors'>
						<Instagram size={16} />
					</Link>

					<Link href='#' className='rounded-full bg-slate-900 border border-slate-700 p-2 text-slate-300 hover:text-emerald-400 hover:border-emerald-500 transition-colors'>
						<Facebook size={16} />
					</Link>
				</div>

				{/* Divider */}
				<div className='my-5 border-t border-slate-800' />

				{/* Copyright */}
				<div className='space-y-1'>
					<p className='text-[10px] text-slate-500'>© {new Date().getFullYear()} mamafarm. All rights reserved.</p>
					<p className='text-[9px] uppercase tracking-widest text-emerald-500/70 font-mono'>Pure Ingredients • True Goodness</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;

