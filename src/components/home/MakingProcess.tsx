'use client';

import { motion } from 'framer-motion';
import { processSteps } from '../../data/home';
import { Award, Eye, Flame, Hand, Package, Droplets, Sparkles } from 'lucide-react';

const iconMap: Record<number, React.ComponentType<{ className?: string }>> = {
	1: Sparkles,
	2: Droplets,
	3: Flame,
	4: Award,
	5: Eye,
	6: Package,
	7: Hand,
};

export default function MakingProcess() {
	return (
		<section className='bg-slate-950 py-10 px-4 border-b border-slate-800' id='process'>
			<div className='w-full'>
				{/* Section Header */}
				<div className='text-center max-w-xs mx-auto mb-8'>
					<span className='inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 border border-emerald-500/20'>
						Hygienic Process
					</span>
					<h2 className='text-xl font-black text-white mb-2'>
						How We Sprout Fresh
					</h2>
					<p className='text-slate-400 text-xs leading-relaxed'>
						Observe our step-by-step hygienic sprouting and express delivery process.
					</p>
				</div>

				{/* Vertical Timeline Mobile View */}
				<div className='relative border-l border-emerald-500/30 ml-4 space-y-4 py-2'>
					{processSteps.map((step, index) => {
						const IconComponent = iconMap[step.id] || Sparkles;

						return (
							<motion.div
								key={step.id}
								initial={{ opacity: 0, x: -15 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true, margin: '-50px' }}
								transition={{ duration: 0.4, delay: 0.05 * index }}
								className='relative pl-6'
							>
								{/* Step Timeline Indicator dot/icon */}
								<div className='absolute -left-3.5 top-1.5 bg-slate-900 border border-emerald-500 rounded-full w-7 h-7 flex items-center justify-center text-emerald-400 shadow-md z-10'>
									<IconComponent className='w-3.5 h-3.5' />
								</div>

								{/* Card Details */}
								<div className='bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow-sm'>
									<div className='text-[10px] font-black tracking-widest text-emerald-400 font-mono mb-1'>
										STEP 0{step.id}
									</div>
									<h3 className='text-sm font-bold text-white mb-1'>
										{step.title}
									</h3>
									<p className='text-slate-300 text-xs leading-relaxed'>
										{step.description}
									</p>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

