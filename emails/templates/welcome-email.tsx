import { Section, Text } from "@react-email/components";
import { EmailButton } from "@/emails/components/button";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface WelcomeEmailProps {
  name?: string | null;
  ctaUrl?: string;
}

export const WelcomeEmail = ({ name, ctaUrl = "https://prompts.art" }: WelcomeEmailProps) => {
  const greetingName = name?.trim() || "friend";

  return (
    <BaseEmail previewText={`Welcome to Prompts, ${greetingName}!`}>
      <Section>
        <Text style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Welcome, {greetingName} 👋</Text>
        <EmailText>
          We’re thrilled to have you in the Prompts community. Each week we share a new three-word brief to
          spark creativity. Submit your photos, explore the gallery, and discover inspiration from others.
        </EmailText>
        <EmailText>
          Ready to jump in? Share your first submission or browse what others are creating this week.
        </EmailText>
        <Section style={{ marginTop: "28px", textAlign: "center" }}>
          <EmailButton href={ctaUrl}>Go to this week’s prompt</EmailButton>
        </Section>
      </Section>
    </BaseEmail>
  );
};
