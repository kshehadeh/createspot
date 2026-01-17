import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export interface BaseEmailProps {
  children: ReactNode;
  previewText?: string;
}

const styles = {
  body: {
    backgroundColor: "#000000",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: 0,
    padding: "40px 20px",
  },
  container: {
    backgroundColor: "#ffffff",
    maxWidth: "520px",
    margin: "0 auto",
    borderRadius: "20px",
    padding: "40px",
  },
  footerText: {
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: "18px",
    textAlign: "center" as const,
    marginTop: "24px",
  },
  divider: {
    borderColor: "#e5e7eb",
    margin: "32px 0",
  },
};

export const BaseEmail = ({ children, previewText }: BaseEmailProps) => (
  <Html>
    <Head />
    {previewText ? <Preview>{previewText}</Preview> : null}
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section>{children}</Section>
        <Hr style={styles.divider} />
        <Text style={styles.footerText}>
          You are receiving this email because you have a Prompts account. Manage notifications in your
          profile.
        </Text>
      </Container>
    </Body>
  </Html>
);
