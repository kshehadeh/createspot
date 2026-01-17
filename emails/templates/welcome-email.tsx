import { Section, Text } from "@react-email/components";
import { EmailButton } from "@/emails/components/button";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface WelcomeEmailProps {
  name?: string | null;
  ctaUrl?: string;
  userId?: string;
  baseUrl?: string;
  t?: (key: string, values?: Record<string, string | number>) => string;
}

export const WelcomeEmail = ({ name, ctaUrl = "https://create.spot", userId, baseUrl, t }: WelcomeEmailProps) => {
  const appName = "Create Spot";
  const greetingName = name?.trim() || (t ? t("email.welcome.friend") : "friend");
  
  // Use translations if available, otherwise fall back to English
  const previewText = t
    ? t("email.welcome.previewText", { appName, name: greetingName })
    : `Welcome to ${appName}, ${greetingName}!`;
  
  const title = t
    ? t("email.welcome.title", { name: greetingName })
    : `Welcome, ${greetingName} 👋`;
  
  const message1 = t
    ? t("email.welcome.message1", { appName })
    : `We're thrilled to have you in the ${appName} community. Each week we share a new three-word brief to spark creativity. Submit your photos, explore the gallery, and discover inspiration from others.`;
  
  const message2 = t
    ? t("email.welcome.message2")
    : "Ready to jump in? Share your first submission or browse what others are creating this week.";
  
  const ctaButtonText = t
    ? t("email.welcome.ctaButton")
    : "Go to this week's prompt";

  return (
    <BaseEmail previewText={previewText} userId={userId} baseUrl={baseUrl} t={t}>
      <Section>
        <Text style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>{title}</Text>
        <EmailText>{message1}</EmailText>
        <EmailText>{message2}</EmailText>
        <Section style={{ marginTop: "28px", textAlign: "center" }}>
          <EmailButton href={ctaUrl}>{ctaButtonText}</EmailButton>
        </Section>
      </Section>
    </BaseEmail>
  );
};
