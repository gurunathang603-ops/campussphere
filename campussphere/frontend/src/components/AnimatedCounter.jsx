import { useEffect, useState } from "react";
import useReveal from "../hooks/useReveal";

export default function AnimatedCounter({ value = 0, suffix = "" }) {
  const [ref, shown] = useReveal();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!shown) return;
    const duration = 1100;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [shown, value]);

  return <span ref={ref}>{n}{suffix}</span>;
}
