// Animation utilities for pika
// Premium animations for fintech app

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
}

export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
}

export const scale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 },
}

export const spring = {
  type: "spring",
  stiffness: 400,
  damping: 25,
}

export const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

// Card animations
export const cardHover = {
  rest: { 
    scale: 1, 
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" 
  },
  hover: { 
    scale: 1.02, 
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    transition: { duration: 0.2 } 
  },
}

// Number counter animation
export const countUp = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 },
}

// Pulse animation for notifications
export const pulse = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
}

// Success checkmark animation
export const checkmark = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
}

// Page transitions
export const pageTransition = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: { duration: 0.25 },
}

// Amount change animation
export const amountChange = {
  initial: { scale: 1.1, color: "#22c55e" },
  animate: { scale: 1, color: "inherit" },
  transition: { duration: 0.3 },
}
