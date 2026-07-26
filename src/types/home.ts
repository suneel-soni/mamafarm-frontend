export interface FeatureCard {
	id: string;
	iconName: string; // Used to dynamically load Lucide icons
	title: string;
	description: string;
}

export interface Ingredient {
	id: string;
	name: string;
	image: string;
	description: string;
}

export interface ProcessStep {
	id: number;
	title: string;
	description: string;
}

export interface OccasionCard {
	id: string;
	title: string;
	description: string;
	iconName: string;
}

export interface PromiseCard {
	id: string;
	title: string;
	description: string;
	iconName: string;
}

export interface FaqItem {
	id: string;
	question: string;
	answer: string;
}
