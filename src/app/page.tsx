import Hero from '../components/Hero';
import WhyChoose from '../components/home/WhyChoose';
import Ingredients from '../components/home/Ingredients';
import WhyUs from '../components/home/WhyUs';
import MakingProcess from '../components/home/MakingProcess';
import Occasions from '../components/home/Occasions';
import Promise from '../components/home/Promise';
import Faq from '../components/home/Faq';
import CTA from '../components/home/CTA';

export default function Home() {
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Mamafarm',
		url: 'https://mamafarm.com',
		logo: 'https://mamafarm.com/images/mamafarm-logo-light.png',
		description: 'Fresh & Hygienic Organic Sprouts. Moong Sprouts, Chana Sprouts & Mixed Sprouts daily fresh supply.',
		contactPoint: {
			'@type': 'ContactPoint',
			telephone: '+91-8130188878',
			contactType: 'customer service',
		},
	};

	return (
		<div className="w-full bg-slate-950 min-h-screen flex justify-center items-start">
			{/* Mobile View Screen Frame */}
			<div className="w-full max-w-md bg-slate-900 text-slate-100 min-h-screen shadow-2xl border-x border-slate-800/80 relative overflow-x-hidden">
				<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

				<Hero />
				<WhyChoose />
				<Ingredients />
				<WhyUs />
				<MakingProcess />
				<Occasions />
				<Promise />
				<Faq />
				<CTA />
			</div>
		</div>
	);
}

