"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay after the element enters view (ms). */
  delay?: number;
  as?: "div" | "section";
  /** When true, children stagger with `.bb-stagger-item`. */
  stagger?: boolean;
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  as = "div",
  stagger = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = {
    "--bb-reveal-delay": `${delay}ms`,
  } as CSSProperties;

  const mergedClassName = [
    "bb-reveal",
    stagger ? "bb-reveal--stagger" : "",
    visible ? "bb-reveal--in" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (as === "section") {
    return (
      <section ref={ref} className={mergedClassName} style={style}>
        {children}
      </section>
    );
  }

  return (
    <div ref={ref} className={mergedClassName} style={style}>
      {children}
    </div>
  );
}
