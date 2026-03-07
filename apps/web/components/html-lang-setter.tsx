"use client";

import { useEffect } from "react";

interface HtmlLangSetterProps {
  locale: string;
}

/**
 * Updates the <html lang> attribute once the locale is resolved server-side.
 * The root layout's static shell defaults to lang="en"; this component
 * corrects it during hydration when the user's actual locale differs.
 */
export function HtmlLangSetter({ locale }: HtmlLangSetterProps) {
  useEffect(() => {
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
