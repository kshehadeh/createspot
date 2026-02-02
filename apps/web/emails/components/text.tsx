import { Text } from "@react-email/components";
import type { ReactNode } from "react";

export interface EmailTextProps {
  children: ReactNode;
  align?: "left" | "center" | "right";
}

export const EmailText = ({ children, align = "left" }: EmailTextProps) => (
  <Text
    style={{
      color: "#111827",
      fontSize: "16px",
      lineHeight: "26px",
      margin: "0 0 16px",
      textAlign: align,
    }}
  >
    {children}
  </Text>
);
