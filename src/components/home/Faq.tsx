'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { faqData } from '../../data/home';

export default function Faq() {
	const [activeId, setActiveId] = useState<string | null>(null);

	const toggleFaq = (id: string) => {
		setActiveId((prev) => (prev === id ? null : id));
	};

	return (
		<section className='bg-slate-900 py-10 px-4 border-b border-slate-800' id='faq'>
			<div className='w-full'>
				{/* Section Header */}
				<div className='text-center max-w-xs mx-auto mb-8'>
					<span className='inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 border border-emerald-500/20'>
						Got Questions?
					</span>
					<h2 className='text-xl font-black text-white mb-2'>
						Frequently Asked Questions
					</h2>
					<p className='text-slate-400 text-xs leading-relaxed'>
						Everything you need to know about our organic sprouts, shelf life, and shop deliveries.
					</p>
				</div>

				{/* Accordion List */}
				<div className='space-y-2.5 w-full'>
					{faqData.map((faq) => {
						const isOpen = activeId === faq.id;

						return (
							<div
								key={faq.id}
								className='bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-hidden shadow-sm'
							>
								{/* Accordion Trigger Header */}
								<button
									onClick={() => toggleFaq(faq.id)}
									className='w-full text-left px-4 py-3 flex items-center justify-between gap-3 focus:outline-none'
									aria-expanded={isOpen}
									aria-controls={`faq-answer-${faq.id}`}
									id={`faq-button-${faq.id}`}
								>
									<span className='flex items-center gap-2.5'>
										<HelpCircle className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span className='font-bold text-white text-xs leading-snug'>
											{faq.question}
										</span>
									</span>
									<motion.div
										animate={{ rotate: isOpen ? 180 : 0 }}
										transition={{ duration: 0.2 }}
										className='flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-emerald-400 border border-slate-700'
									>
										<ChevronDown className='w-3.5 h-3.5' />
									</motion.div>
								</button>

								{/* Accordion Panel Body */}
								<AnimatePresence initial={false}>
									{isOpen && (
										<motion.div
											id={`faq-answer-${faq.id}`}
											role='region'
											aria-labelledby={`faq-button-${faq.id}`}
											initial={{ height: 0, opacity: 0 }}
											animate={{
												height: 'auto',
												opacity: 1,
												transition: {
													height: { duration: 0.2, ease: 'easeOut' },
													opacity: { duration: 0.15 },
												},
											}}
											exit={{
												height: 0,
												opacity: 0,
												transition: {
													height: { duration: 0.2, ease: 'easeIn' },
													opacity: { duration: 0.1 },
												},
											}}
										>
											<div className='px-4 pb-3.5 pt-0 text-slate-300 text-xs leading-relaxed pl-10 border-t border-slate-700/40'>
												{faq.answer}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

