"use client";

// Cinematic text reveal — words rise out of a masked line with a blur-to-sharp
// settle. Reserved for hero moments (login headline, route titles).

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function RevealText({
  text,
  className,
  delay = 0,
  per = 0.05,
}: {
  text: string;
  className?: string;
  delay?: number;
  per?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={cn("inline-flex flex-wrap gap-x-[0.3em]", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{
              delay: delay + i * per,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            aria-hidden
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
