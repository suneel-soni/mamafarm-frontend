'use client';

import { motion, Variants } from 'framer-motion';
import { Sparkles, BookOpen, Flame, Leaf } from 'lucide-react';
import { whyChooseData } from '../../data/home';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	Sparkles: Sparkles,
	BookOpen: BookOpen,
	Flame: Flame,
	Leaf: Leaf,
};

export default function WhyChoose() {
	const containerVariants: Variants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants: Variants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { type: 'spring', stiffness: 100, damping: 15 },
		},
	};

	return (
		<section className='bg-slate-900 py-10 px-4 border-b border-slate-800' id='why-choose'>
			<div className='w-full'>
				<div className='text-center max-w-xs mx-auto mb-8'>
					<span className='inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 border border-emerald-500/20'>
						Why Choose MamaFarm
					</span>
					<h2 className='text-xl font-black text-white mb-2 leading-snug'>
						Grown with Purity.<br />
						<span className='text-emerald-400 font-serif italic font-normal'>Delivered Fresh.</span>
					</h2>
					<p className='text-slate-400 text-xs leading-relaxed'>
						Every packet of MamaFarm Organic Sprouts is sprouted naturally using clean filtered water under absolute hygiene.
					</p>
				</div>

				<motion.div
					variants={containerVariants}
					initial='hidden'
					whileInView='visible'
					viewport={{ once: true, margin: '-50px' }}
					className='grid grid-cols-1 gap-3'
				>
					{whyChooseData.map((card) => {
						const IconComponent = iconMap[card.iconName] || Sparkles;
						return (
							<motion.div
								key={card.id}
								variants={itemVariants}
								className='bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex items-start gap-3.5 shadow-sm'
							>
								<div className='w-10 h-10 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20'>
									<IconComponent className='w-5 h-5' />
								</div>
								<div>
									<h3 className='text-sm font-bold text-white mb-1'>{card.title}</h3>
									<p className='text-slate-300 text-xs leading-relaxed'>{card.description}</p>
								</div>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
}

