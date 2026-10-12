"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay after the element enters view (ms). */
  delay?: number;
  as?: "div" | "section";
  /** When true, children stagger with `.bb-stagger-item`. */
  stagger?: boolean;
};

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  as = "div",
  stagger = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const visible = reduceMotion || inView;

  useEffect(() => {
    if (reduceMotion) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

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

  const Tag = as === "section" ? "section" : "div";

  return (
    <Tag ref={ref} className={mergedClassName} style={style}>
      {children}
    </Tag>
  );
}
