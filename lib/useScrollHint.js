"use client";

import { useEffect, useRef } from "react";

/**
 * For a sideways-scrolling row (top nav, Home view tabs): marks the edges that have more content
 * (data-more-left / data-more-right, styled as a fade with a chevron) and scrolls the active item
 * into view, so on a phone it is clear the row continues.
 */
export default function useScrollHint(activeKey) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const update = () => {
      el.dataset.moreRight = String(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
      el.dataset.moreLeft = String(el.scrollLeft > 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update); ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, []);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const on = el.querySelector('[aria-current="page"], [aria-current="true"]');
    if (on && el.scrollWidth > el.clientWidth) {
      const left = on.offsetLeft - el.clientWidth / 2 + on.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }, [activeKey]);
  return ref;
}
