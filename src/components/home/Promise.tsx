'use client';

import { motion, Variants } from 'framer-motion';
import { promiseData } from '../../data/home';
import { CheckCircle, Scroll, Flame, ShieldCheck, HeartHandshake, Smile } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	CheckCircle: CheckCircle,
	Scroll: Scroll,
	Flame: Flame,
	ShieldCheck: ShieldCheck,
	HeartHandshake: HeartHandshake,
	Smile: Smile,
};

export default function Promise() {
	const containerVariants: Variants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.08,
			},
		},
	};

	const itemVariants: Variants = {
		hidden: { opacity: 0, scale: 0.95, y: 15 },
		visible: {
			opacity: 1,
			scale: 1,
			y: 0,
			transition: { type: 'spring', stiffness: 100, damping: 15 },
		},
	};

	return (
		<section className='bg-slate-950 py-10 px-4 border-b border-slate-800' id='promise'>
			<div className='w-full'>
				{/* Section Header */}
				<div className='text-center max-w-xs mx-auto mb-8'>
					<span className='inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 border border-emerald-500/20'>
						Our Commitments
					</span>
					<h2 className='text-xl font-black text-white mb-2'>
						MamaFarm Sincere Promise
					</h2>
					<p className='text-slate-400 text-xs leading-relaxed'>
						Absolute purity, zero chemical additives, and reliable daily delivery.
					</p>
				</div>

				{/* Promise Cards Grid */}
				<motion.div
					variants={containerVariants}
					initial='hidden'
					whileInView='visible'
					viewport={{ once: true, margin: '-50px' }}
					className='grid grid-cols-1 gap-3'
				>
					{promiseData.map((promise) => {
						const IconComponent = iconMap[promise.iconName] || CheckCircle;
						return (
							<motion.div
								key={promise.id}
								variants={itemVariants}
								className='bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-sm flex items-start gap-3'
							>
								<div className='w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20'>
									<IconComponent className='w-4 h-4' />
								</div>
								<div>
									<h3 className='text-xs font-extrabold text-white mb-1'>
										{promise.title}
									</h3>
									<p className='text-slate-300 text-xs leading-relaxed'>
										{promise.description}
									</p>
								</div>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
}

