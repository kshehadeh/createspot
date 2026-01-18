import { Img, Section, Text } from "@react-email/components";
import { EmailButton } from "@/emails/components/button";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface NewPromptNotificationEmailProps {
  userName?: string | null;
  word1: string;
  word2: string;
  word3: string;
  promptUrl: string;
  playUrl: string;
  baseUrl: string;
  userId: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const NewPromptNotificationEmail = ({
  userName,
  word1,
  word2,
  word3,
  promptUrl,
  playUrl,
  baseUrl,
  userId,
  t,
}: NewPromptNotificationEmailProps) => {
  const greeting = userName
    ? t("newPromptNotification.greetingWithName", { name: userName })
    : t("newPromptNotification.greeting");

  const previewText = t("newPromptNotification.previewText", {
    word1,
    word2,
    word3,
  });

  const logoUrl = `${baseUrl}/images/create-spot-logo.svg`;

  return (
    <BaseEmail previewText={previewText} userId={userId} baseUrl={baseUrl} t={t}>
      <Section style={{ marginBottom: "32px", textAlign: "center" }}>
        <Img
          src={logoUrl}
          alt="Create Spot"
          width="120"
          height="131"
          style={{ margin: "0 auto" }}
        />
      </Section>
      <Section>
        <Text style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>
          ✨ {t("newPromptNotification.title")}
        </Text>
        <EmailText>{greeting}</EmailText>
        <Section
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: "12px",
            padding: "24px",
            margin: "24px 0",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              letterSpacing: "0.5px",
            }}
          >
            {word1} / {word2} / {word3}
          </Text>
        </Section>
        <EmailText>{t("newPromptNotification.description")}</EmailText>
        <Section style={{ marginTop: "28px", textAlign: "center" }}>
          <EmailButton href={playUrl}>
            {t("newPromptNotification.startCreatingButton")}
          </EmailButton>
        </Section>
        <Section style={{ marginTop: "20px", textAlign: "center" }}>
          <Text style={{ fontSize: "14px", color: "#6b7280", textAlign: "center" }}>
            <a href={promptUrl} style={{ color: "#3b82f6", textDecoration: "none" }}>
              {t("newPromptNotification.learnMore")}
            </a>
          </Text>
        </Section>
      </Section>
    </BaseEmail>
  );
};
