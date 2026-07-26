'use client';

import { motion } from 'framer-motion';
import { Ingredient } from '../../types/home';
import { Sprout } from 'lucide-react';

interface IngredientCardProps {
	ingredient: Ingredient;
}

export default function IngredientCard({ ingredient }: IngredientCardProps) {
	return (
		<motion.div
			whileTap={{ scale: 0.98 }}
			className='group bg-slate-800/90 rounded-xl overflow-hidden border border-slate-700/60 shadow-md flex flex-col h-full'
		>
			<div className='p-4 flex flex-col flex-grow'>
				<div className='flex items-center gap-2 mb-2'>
					<div className='w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-500/20'>
						<Sprout className='w-4 h-4' />
					</div>
					<h3 className='text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors'>
						{ingredient.name}
					</h3>
				</div>
				<p className='text-slate-300 text-xs leading-relaxed flex-grow'>
					{ingredient.description}
				</p>
			</div>
		</motion.div>
	);
}

