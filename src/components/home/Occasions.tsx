'use client';

import { motion, Variants } from 'framer-motion';
import { occasionsData } from '../../data/home';
import { Sparkles, Briefcase, Users, Gift, Building, Heart } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	Sparkles: Sparkles,
	Briefcase: Briefcase,
	Users: Users,
	Gift: Gift,
	Building: Building,
	Heart: Heart,
};

export default function Occasions() {
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
		hidden: { opacity: 0, y: 15 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { type: 'spring', stiffness: 100, damping: 15 },
		},
	};

	return (
		<section className='bg-slate-900 py-10 px-4 border-b border-slate-800' id='occasions'>
			<div className='w-full'>
				{/* Section Header */}
				<div className='text-center max-w-xs mx-auto mb-8'>
					<span className='inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 border border-emerald-500/20'>
						Healthy Lifestyle
					</span>
					<h2 className='text-xl font-black text-white mb-2'>
						Perfect for Every Day
					</h2>
					<p className='text-slate-400 text-xs leading-relaxed'>
						Integrate fresh organic sprouts into your daily meals, workouts, and retail counters.
					</p>
				</div>

				{/* Cards Grid */}
				<motion.div
					variants={containerVariants}
					initial='hidden'
					whileInView='visible'
					viewport={{ once: true, margin: '-50px' }}
					className='grid grid-cols-1 gap-3'
				>
					{occasionsData.map((occasion) => {
						const IconComponent = iconMap[occasion.iconName] || Gift;
						return (
							<motion.div
								key={occasion.id}
								variants={itemVariants}
								className='bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex items-start gap-3 shadow-sm'
							>
								<div className='w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20'>
									<IconComponent className='w-4 h-4' />
								</div>
								<div>
									<h3 className='text-xs font-extrabold text-white mb-1'>
										{occasion.title}
									</h3>
									<p className='text-slate-300 text-xs leading-relaxed'>
										{occasion.description}
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

