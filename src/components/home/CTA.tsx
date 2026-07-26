'use client';

import { motion } from 'framer-motion';
import { Phone, ShoppingBag } from 'lucide-react';

export default function CTA() {
	return (
		<section className='bg-slate-950 py-10 px-4 border-b border-slate-800' id='cta'>
			<div className='w-full'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className='relative bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden p-6 text-center text-white border border-emerald-800/40 shadow-xl'
				>
					<div className='relative z-10'>
						<span className='inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold tracking-wider uppercase mb-3 border border-emerald-500/30'>
							Order Fresh Sprouts Daily
						</span>
						<h2 className='text-xl font-black mb-2 text-white leading-tight font-serif'>
							Get Fresh Organic Sprouts <br />
							<span className='text-emerald-400 italic font-normal'>Delivered To Your Door or Shop</span>
						</h2>
						<p className='text-slate-300 text-xs mb-6 leading-relaxed'>
							Crisp, hygienic Moong, Chana & Mixed Sprouts packs available for home consumption and retail store delivery.
						</p>

						{/* CTA Buttons */}
						<div className='flex flex-col gap-2.5'>
							{/* Whatsapp Order Button */}
							<a
								href='https://wa.me/918130188878?text=Hello%20MamaFarm!%20I%20want%20to%20order%20fresh%20Organic%20Sprouts.'
								target='_blank'
								rel='noopener noreferrer'
								className='w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-xl text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all'
							>
								<ShoppingBag className='w-4 h-4' />
								<span>Order via WhatsApp</span>
							</a>

							{/* Phone Call Button */}
							<a
								href='tel:8130188878'
								className='w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-5 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all'
							>
								<Phone className='w-4 h-4 text-emerald-400' />
								<span>Call Helpline: 8130188878</span>
							</a>
						</div>

						{/* FSSAI Licensing */}
						<p className='mt-6 text-[9px] text-slate-400 tracking-widest uppercase font-mono'>
							FSSAI LIC. NO: 21226188002092
						</p>
					</div>
				</motion.div>
			</div>
		</section>
	);
}

