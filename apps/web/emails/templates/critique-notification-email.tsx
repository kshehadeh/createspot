import { Img, Section, Text } from "@react-email/components";
import { EmailButton } from "@/emails/components/button";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface CritiqueNotificationEmailProps {
  critiquerName?: string | null;
  submissionTitle?: string | null;
  submissionUrl: string;
  critiquerProfileUrl: string;
  baseUrl: string;
  userId: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const CritiqueNotificationEmail = ({
  critiquerName = "Someone",
  submissionTitle,
  submissionUrl,
  critiquerProfileUrl,
  baseUrl,
  userId,
  t,
}: CritiqueNotificationEmailProps) => {
  const titleDisplay = submissionTitle
    ? `"${submissionTitle}"`
    : t("critiqueNotification.yourWork");

  const previewText = t("critiqueNotification.previewText", {
    critiquerName: critiquerName || t("critiqueNotification.someone"),
    titleDisplay,
  });

  const logoUrl = `${baseUrl}/images/create-spot-logo-white-rectangle.png`;

  return (
    <BaseEmail
      previewText={previewText}
      userId={userId}
      baseUrl={baseUrl}
      t={t}
    >
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
        <Text
          style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}
        >
          💬 {t("critiqueNotification.title")}
        </Text>
        <EmailText>
          {t("critiqueNotification.message", {
            critiquerName: critiquerName || t("critiqueNotification.someone"),
            titleDisplay,
          })}
        </EmailText>
        <EmailText>{t("critiqueNotification.description")}</EmailText>
        <Section style={{ marginTop: "28px", textAlign: "center" }}>
          <EmailButton href={submissionUrl}>
            {t("critiqueNotification.viewWorkButton")}
          </EmailButton>
        </Section>
        <Section style={{ marginTop: "20px", textAlign: "center" }}>
          <Text
            style={{ fontSize: "14px", color: "#6b7280", textAlign: "center" }}
          >
            <a
              href={critiquerProfileUrl}
              style={{ color: "#3b82f6", textDecoration: "none" }}
            >
              {t("critiqueNotification.visitProfile", {
                critiquerName:
                  critiquerName || t("critiqueNotification.someone"),
              })}
            </a>
          </Text>
        </Section>
      </Section>
    </BaseEmail>
  );
};
