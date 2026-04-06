"use client";

import { useEffect } from "react";

/** Tailwind `md` breakpoint minus 1px */
const MOBILE_MAX_WIDTH_MQ = "(max-width: 767px)";

/**
 * On the public home / feed, mobile browsers often reserve width for a persistent
 * scrollbar. Hiding it keeps the layout width stable while scroll still works.
 * Class is removed on unmount (e.g. client navigation away from `/`).
 */
export function PublicHomeMobileScrollbar() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const sync = () => {
      const isMobile = window.matchMedia(MOBILE_MAX_WIDTH_MQ).matches;
      if (isMobile) {
        html.classList.add("scrollbar-hide");
        body.classList.add("scrollbar-hide");
      } else {
        html.classList.remove("scrollbar-hide");
        body.classList.remove("scrollbar-hide");
      }
    };

    sync();
    const mq = window.matchMedia(MOBILE_MAX_WIDTH_MQ);
    mq.addEventListener("change", sync);

    return () => {
      mq.removeEventListener("change", sync);
      html.classList.remove("scrollbar-hide");
      body.classList.remove("scrollbar-hide");
    };
  }, []);

  return null;
}
