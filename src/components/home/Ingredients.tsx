'use client';

import { motion, Variants } from 'framer-motion';
import { ingredientsData } from '../../data/home';
import IngredientCard from './IngredientCard';

export default function Ingredients() {
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
		hidden: { opacity: 0, scale: 0.95, y: 15 },
		visible: {
			opacity: 1,
			scale: 1,
			y: 0,
			transition: { type: 'spring', stiffness: 100, damping: 15 },
		},
	};

	return (
		<section className='bg-slate-950 py-10 px-4 border-b border-slate-800' id='ingredients'>
			<div className='w-full'>
				<div className='text-center max-w-xs mx-auto mb-8'>
					<span className='inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 border border-emerald-500/20'>
						Our Product Offerings
					</span>
					<h2 className='text-xl font-black text-white mb-2'>
						Fresh Sprouts Packs
					</h2>
					<p className='text-slate-400 text-xs leading-relaxed'>
						Freshly germinated daily and packed in hygienic, weight-verified packets for maximum nutrition.
					</p>
				</div>

				<motion.div
					variants={containerVariants}
					initial='hidden'
					whileInView='visible'
					viewport={{ once: true, margin: '-50px' }}
					className='grid grid-cols-1 gap-3'
				>
					{ingredientsData.map((ingredient) => (
						<motion.div key={ingredient.id} variants={itemVariants}>
							<IngredientCard ingredient={ingredient} />
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}

