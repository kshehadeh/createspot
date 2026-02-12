import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { buildRoutePath, getRoute } from "@/lib/routes";

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
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
  footerLink: {
    color: "#3b82f6",
    textDecoration: "none",
  },
  divider: {
    borderColor: "#e5e7eb",
    margin: "32px 0",
  },
};

export const BaseEmail = ({
  children,
  previewText,
  userId,
  baseUrl,
  t,
}: BaseEmailProps) => {
  const appName = "Create Spot";

  // Use translations if available, otherwise fall back to English
  const receivingReason = t
    ? t("footer.receivingReason", { appName })
    : `You are receiving this email because you have a ${appName} account.`;

  const manageNotificationsText = t
    ? t("footer.manageNotifications")
    : "Manage notifications in your profile";

  const visitSiteText = t ? t("footer.visitSite") : "Visit Create Spot";

  const termsText = t ? t("footer.terms") : "Terms of Service";

  const companyInfo = t ? t("footer.companyInfo") : "Create Spot";

  // Build URLs
  const siteUrl = baseUrl || "https://create.spot";
  const profileUrl =
    userId && baseUrl
      ? `${baseUrl}${buildRoutePath("profile", { creatorid: userId })}`
      : undefined;
  const termsUrl = baseUrl ? `${baseUrl}${getRoute("terms").path}` : undefined;

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
              <Link href={profileUrl} style={styles.footerLink}>
                {manageNotificationsText}
              </Link>
            ) : (
              manageNotificationsText
            )}
            .
          </Text>
          <Text style={styles.footerText}>
            <Link href={siteUrl} style={styles.footerLink}>
              {visitSiteText}
            </Link>
            {termsUrl && (
              <>
                {" • "}
                <Link href={termsUrl} style={styles.footerLink}>
                  {termsText}
                </Link>
              </>
            )}
          </Text>
          <Text style={styles.footerText}>{companyInfo}</Text>
        </Container>
      </Body>
    </Html>
  );
};
