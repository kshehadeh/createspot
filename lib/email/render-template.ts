import { render } from "@react-email/render";
import type { ReactElement } from "react";

export interface RenderEmailOptions {
  pretty?: boolean;
  plainText?: boolean;
}

export interface RenderedEmail {
  html: string;
  text?: string;
}

export const renderEmailTemplate = async (
  component: ReactElement,
  options: RenderEmailOptions = {},
): Promise<RenderedEmail> => {
  const html = await render(component, { pretty: options.pretty ?? true });
  const text =
    options.plainText === false
      ? undefined
      : await render(component, { plainText: true });

  return { html, text };
};
