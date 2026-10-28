// lib/animations.ts
import { Variants } from "framer-motion";

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export const cardHoverVariants: Variants = {
  initial: { y: 0, scale: 1 },
  hover: { y: -8, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }
};