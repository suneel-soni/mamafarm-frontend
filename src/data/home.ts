import {
	FeatureCard,
	Ingredient,
	ProcessStep,
	OccasionCard,
	PromiseCard,
	FaqItem,
} from '../types/home';

export const whyChooseData: FeatureCard[] = [
	{
		id: 'organic',
		iconName: 'Sparkles',
		title: '100% Fresh & Organic',
		description: 'Sourced from premium quality whole grains and germinated naturally without any chemicals or preservatives.',
	},
	{
		id: 'hygiene',
		iconName: 'BookOpen',
		title: 'Hygienic Sprouting',
		description: 'Grown and washed using clean filtered water under strictly monitored, sterile temperature conditions.',
	},
	{
		id: 'fresh-daily',
		iconName: 'Flame',
		title: 'Daily Fresh Batches',
		description: 'Sprouted fresh every single morning and packed immediately for maximum crunch, nutrition, and vitality.',
	},
	{
		id: 'nutrition',
		iconName: 'Leaf',
		title: 'Nutrient Superfood',
		description: 'Packed with rich plant protein, dietary fiber, essential vitamins, and active digestive enzymes.',
	},
];

export const ingredientsData: Ingredient[] = [
	{
		id: 'moong',
		name: 'Moong Sprouts',
		image: '/images/moong-sprouts.jpg',
		description: 'Crisp, fresh whole green gram sprouts. High in plant protein, light on stomach, and easy to digest.',
	},
	{
		id: 'chana',
		name: 'Chana Sprouts',
		image: '/images/chana-sprouts.jpg',
		description: 'Nutritious brown chickpea sprouts offering a nutty crunch, loaded with fiber and sustained energy.',
	},
	{
		id: 'mixed',
		name: 'Mixed Sprouts',
		image: '/images/mixed-sprouts.jpg',
		description: 'A wholesome power blend of Moong, Chana, and legumes for balanced nutrients and delicious texture.',
	},
	{
		id: 'water',
		name: 'Filtered Water Soak',
		image: '/images/pure-water.jpg',
		description: 'Soaked and germinated strictly using purified water to ensure zero contamination and long fresh life.',
	},
];

export const whyUsChecklist: string[] = [
	'100% Organic Sprouts',
	'Zero Preservatives',
	'Filtered Water Process',
	'Daily Fresh Dispatch',
	'Hygienically Packed',
	'High Protein & Fiber',
];

export const processSteps: ProcessStep[] = [
	{
		id: 1,
		title: 'Grain Selection',
		description: 'We carefully select non-GMO, unpolished whole green gram and legumes from trusted organic farms.',
	},
	{
		id: 2,
		title: 'Purified Water Soaking',
		description: 'Grains are thoroughly washed and soaked in clean filtered water for optimum hydration.',
	},
	{
		id: 3,
		title: 'Controlled Sprouting',
		description: 'Kept in clean, ventilated germination chambers to develop sweet, tender, high-protein sprouts.',
	},
	{
		id: 4,
		title: 'Triple Rinsing',
		description: 'Harvested sprouts undergo gentle rinsing to remove husk and ensure squeaky-clean freshness.',
	},
	{
		id: 5,
		title: 'Quality Inspection',
		description: 'Inspected for size, sprout tail length, crispness, and uniform quality before pouching.',
	},
	{
		id: 6,
		title: 'Hygienic Packaging',
		description: 'Sealed in breathable, food-grade tamper-evident pouches to lock in crunch and nutrient moisture.',
	},
	{
		id: 7,
		title: 'Daily Express Supply',
		description: 'Dispatched early morning directly to partner retail shops and healthy homes.',
	},
];

export const occasionsData: OccasionCard[] = [
	{
		id: 'breakfast',
		title: 'Daily Healthy Breakfast',
		description: 'Start your morning with a fresh bowl of protein-packed sprouts for clean, long-lasting energy.',
		iconName: 'Sparkles',
	},
	{
		id: 'fitness',
		title: 'Gym & Pre-Workout',
		description: 'Natural post-workout plant protein boost to assist muscle recovery and stamina.',
		iconName: 'Briefcase',
	},
	{
		id: 'snack',
		title: 'Office & Evening Snack',
		description: 'Replace fried snacks with crisp sprouted salad topped with lemon, cucumber, and mild spices.',
		iconName: 'Users',
	},
	{
		id: 'weight-loss',
		title: 'Weight Loss & Diets',
		description: 'Low-calorie, fiber-dense superfood that keeps you satisfied longer and aids digestion.',
		iconName: 'Gift',
	},
	{
		id: 'retail',
		title: 'Retail Shop Supply',
		description: 'Fresh daily batch deliveries for grocery stores, organic counters, and daily vendors.',
		iconName: 'Building',
	},
	{
		id: 'kids',
		title: 'Kids & Family Health',
		description: 'Wholesome, easy-to-digest nutrition for growing children and energy for elderly family members.',
		iconName: 'Heart',
	},
];

export const promiseData: PromiseCard[] = [
	{
		id: 'fresh-daily',
		title: 'Guaranteed Daily Fresh',
		description: 'Harvested and packed on the same day to ensure maximum freshness and crisp texture.',
		iconName: 'CheckCircle',
	},
	{
		id: 'clean-water',
		title: 'Pure Filtered Water',
		description: 'Grown exclusively with purified water to safeguard purity and health.',
		iconName: 'Scroll',
	},
	{
		id: 'no-chemicals',
		title: 'Zero Chemical Additives',
		description: '100% natural germination without any bleach, preservatives, or artificial growth sprays.',
		iconName: 'Flame',
	},
	{
		id: 'hygiene-check',
		title: 'Strict Hygiene Control',
		description: 'Handled in clean food-grade facilities with gloves, caps, and sanitized equipment.',
		iconName: 'ShieldCheck',
	},
	{
		id: 'high-protein',
		title: 'Bio-Available Protein',
		description: 'Sprouting activates enzymes and increases bioavailability of protein, iron, and folate.',
		iconName: 'HeartHandshake',
	},
	{
		id: 'customer-first',
		title: 'Reliable Supply Chain',
		description: 'Dedicated daily delivery service ensuring shops and customers never run out.',
		iconName: 'Smile',
	},
];

export const faqData: FaqItem[] = [
	{
		id: 'faq-1',
		question: 'Are MamaFarm Sprouts 100% organic and fresh?',
		answer: 'Yes! We use premium whole grains, soaked and sprouted using purified water. We produce fresh batches every single day without any chemicals or preservatives.',
	},
	{
		id: 'faq-2',
		question: 'What varieties of sprouts are available?',
		answer: 'We currently offer Moong Sprouts, Chana Sprouts, and Mixed Sprouts packed in convenient food-grade pouches.',
	},
	{
		id: 'faq-3',
		question: 'How long do the sprouts stay fresh?',
		answer: 'Our sprouts stay crisp and fresh for up to 3 to 4 days when stored in the refrigerator (2°C - 5°C). We recommend keeping them chilled.',
	},
	{
		id: 'faq-4',
		question: 'Do I need to wash them before consuming?',
		answer: 'Our sprouts are rinsed with purified water before packaging. However, a quick light rinse in cold water before raw eating or salad prep is always good practice.',
	},
	{
		id: 'faq-5',
		question: 'Do you supply to retail shops and bulk buyers?',
		answer: 'Yes! We supply daily fresh packet consignments to grocery stores, supermarkets, and vegetable vendors across our city routes. Contact us at 8130188878 for retail partnership.',
	},
];

