import { Link } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

export interface EmailButtonProps {
  href: string;
  children: ReactNode;
}

const buttonStyle: CSSProperties = {
  backgroundColor: "#0f172a",
  borderRadius: "9999px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: 600,
  padding: "12px 28px",
  textDecoration: "none",
};

export const EmailButton = ({ href, children }: EmailButtonProps) => (
  <Link href={href} style={buttonStyle} target="_blank" rel="noreferrer">
    {children}
  </Link>
);
