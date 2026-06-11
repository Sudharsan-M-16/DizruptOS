"use client";

// Route-level entrance choreography. Next.js re-mounts template.tsx on every
// navigation, so each screen rises into place — T1 ambient motion, free for
// every current and future route.

import { motion } from "framer-motion";
import { pageEnter } from "@/lib/motion";

export default function ShellTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={pageEnter} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}
