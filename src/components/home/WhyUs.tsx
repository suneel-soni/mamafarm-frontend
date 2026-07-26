'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { whyUsChecklist } from '../../data/home';

export default function WhyUs() {
	return (
		<section className='bg-slate-900 py-10 px-4 border-b border-slate-800' id='why-us'>
			<div className='w-full'>
				<div className='text-center max-w-xs mx-auto mb-6'>
					<span className='inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 border border-emerald-500/20'>
						Uncompromised Standards
					</span>
					<h2 className='text-xl font-black text-white mb-2 leading-snug'>
						Why Customers & Retailers Love MamaFarm
					</h2>
					<p className='text-slate-400 text-xs leading-relaxed'>
						We believe clean food gives real energy. Our sprouts are sprouted naturally with filtered water and delivered daily.
					</p>
				</div>

				{/* Checklist Grid in Mobile View */}
				<div className='grid grid-cols-1 gap-2.5'>
					{whyUsChecklist.map((item, index) => (
						<motion.div
							key={item}
							initial={{ opacity: 0, x: -15 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4, delay: 0.05 * index }}
							className='flex items-center space-x-3 bg-slate-800/90 py-3 px-4 rounded-xl border border-slate-700/60 shadow-sm'
						>
							<div className='flex-shrink-0 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm'>
								<Check className='w-3.5 h-3.5 stroke-[3]' />
							</div>
							<span className='font-bold text-white text-xs'>{item}</span>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}

