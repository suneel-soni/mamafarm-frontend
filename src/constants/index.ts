import { NavItem, Product } from "../types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "#products" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export const PRODUCTS: Product[] = [
  {
    id: "rice",
    title: "Premium Rice",
    description: "Long-grain, aromatic rice sourced from the finest fields.",
    image: "/images/rice.png",
    features: ["Aromatic", "Long Grain", "Naturally Aged"],
  },
  {
    id: "atta",
    title: "Whole Wheat Atta",
    description: "Stone-ground whole wheat flour for soft and nutritious rotis.",
    image: "/images/atta.png",
    features: ["100% Whole Wheat", "Stone Ground", "High Fiber"],
  },
  {
    id: "besan",
    title: "Chana Besan",
    description: "Pure and fine gram flour for perfect snacks and recipes.",
    image: "/images/besan.png",
    features: ["Pure Chana", "Fine Texture", "Protein Rich"],
  },
  {
    id: "dal",
    title: "Indian Dal",
    description: "Unpolished, protein-packed lentils for your daily nutrition.",
    image: "/images/dal.png",
    features: ["Unpolished", "Protein Rich", "Farm Fresh"],
  },
  {
    id: "spices",
    title: "Natural Spices",
    description: "Authentic and pure spices that bring real flavor to your kitchen.",
    image: "/images/spices.png",
    features: ["No Additives", "Pure Aroma", "Hand-picked"],
  },
  {
    id: "protein-bar",
    title: "Protein Bar",
    description: "Nutritious and delicious bars made with natural ingredients.",
    image: "/images/protien-bar.png",
    features: ["Natural Ingredients", "High Protein", "No Added Sugar"],
  },
];
