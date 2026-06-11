"use client";

// Kinetic decode — characters scramble then lock in left-to-right. Adapted
// from the 21st.dev prompt set; used on landing nav links and section kickers.

import * as React from "react";
import { cn } from "@/lib/utils";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&";

export function TextScramble({
  text,
  className,
  auto = false,
}: {
  text: string;
  className?: string;
  /** scramble once on mount instead of on hover */
  auto?: boolean;
}) {
  const [display, setDisplay] = React.useState(text);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = React.useRef(0);

  const scramble = React.useCallback(() => {
    frameRef.current = 0;
    const duration = Math.max(text.length * 2.2, 14);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      frameRef.current++;
      const revealed = Math.floor((frameRef.current / duration) * text.length);
      setDisplay(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            if (i < revealed) return text[i];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      if (frameRef.current >= duration) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplay(text);
      }
    }, 28);
  }, [text]);

  React.useEffect(() => {
    if (auto) scramble();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [auto, scramble]);

  return (
    <span
      onMouseEnter={auto ? undefined : scramble}
      className={cn("inline-block whitespace-pre font-mono tabular-nums", className)}
      aria-label={text}
    >
      {display}
    </span>
  );
}
