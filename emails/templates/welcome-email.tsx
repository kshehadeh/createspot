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
  const greetingName = name?.trim() || (t ? t("welcome.friend") : "friend");
  
  // Use translations if available, otherwise fall back to English
  const previewText = t
    ? t("welcome.previewText", { appName, name: greetingName })
    : `Welcome to ${appName}, ${greetingName}!`;
  
  const title = t
    ? t("welcome.title", { name: greetingName })
    : `Welcome, ${greetingName} 👋`;
  
  const message1 = t
    ? t("welcome.message1", { appName })
    : `We're thrilled to have you in the ${appName} community.`;
  
  const permanentCollection = t
    ? t("welcome.permanentCollection")
    : "Explore the permanent collection through three unique views: browse the grid, navigate the constellation, or discover artists on the global map.";
  
  const exhibits = t
    ? t("welcome.exhibits")
    : "Discover curated exhibits that showcase themed collections and highlight exceptional work from the community.";
  
  const portfolio = t
    ? t("welcome.portfolio")
    : "Build and manage your portfolio over time. Curate the pieces that represent you best and share them when you want to be seen.";
  
  const promptGame = t
    ? t("welcome.promptGame")
    : "Finally, join the weekly prompt inspiration game. Each week we share a new three-word brief to spark creativity—use it to create something new or connect an existing portfolio piece that fits the theme.";
  
  const ctaButtonText = t
    ? t("welcome.ctaButton")
    : "Explore the collection";

  return (
    <BaseEmail previewText={previewText} userId={userId} baseUrl={baseUrl} t={t}>
      <Section>
        <Text style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>{title}</Text>
        <EmailText>{message1}</EmailText>
        <EmailText>{permanentCollection}</EmailText>
        <EmailText>{exhibits}</EmailText>
        <EmailText>{portfolio}</EmailText>
        <EmailText>{promptGame}</EmailText>
        <Section style={{ marginTop: "28px", textAlign: "center" }}>
          <EmailButton href={ctaUrl}>{ctaButtonText}</EmailButton>
        </Section>
      </Section>
    </BaseEmail>
  );
};
