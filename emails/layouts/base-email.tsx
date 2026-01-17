import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export interface BaseEmailProps {
  children: ReactNode;
  previewText?: string;
  userId?: string;
  baseUrl?: string;
  t?: (key: string, values?: Record<string, string | number>) => string;
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

export const BaseEmail = ({ children, previewText, userId, baseUrl, t }: BaseEmailProps) => {
  const appName = "Create Spot";
  
  // Use translations if available, otherwise fall back to English
  const receivingReason = t
    ? t("footer.receivingReason", { appName })
    : `You are receiving this email because you have a ${appName} account.`;
  
  const manageNotificationsText = t
    ? t("footer.manageNotifications")
    : "Manage notifications in your profile";
  
  // Build profile URL if userId and baseUrl are provided
  const profileUrl = userId && baseUrl ? `${baseUrl}/profile/${userId}` : undefined;
  
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section>{children}</Section>
          <Hr style={styles.divider} />
          <Text style={styles.footerText}>
            {receivingReason}{" "}
            {profileUrl ? (
              <Link href={profileUrl} style={{ color: "#3b82f6", textDecoration: "none" }}>
                {manageNotificationsText}
              </Link>
            ) : (
              manageNotificationsText
            )}
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
