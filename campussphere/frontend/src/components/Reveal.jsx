import { motion } from "framer-motion";
import useReveal from "../hooks/useReveal";

export default function Reveal({ children, delay = 0, y = 16, className = "" }) {
  const [ref, shown] = useReveal();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
