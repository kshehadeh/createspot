import { Img, Section, Text } from "@react-email/components";
import { EmailButton } from "@/emails/components/button";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface CommentNotificationEmailProps {
  commenterName?: string | null;
  submissionTitle?: string | null;
  submissionUrl: string;
  commenterProfileUrl: string;
  baseUrl: string;
  userId: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const CommentNotificationEmail = ({
  commenterName = "Someone",
  submissionTitle,
  submissionUrl,
  commenterProfileUrl,
  baseUrl,
  userId,
  t,
}: CommentNotificationEmailProps) => {
  const titleDisplay = submissionTitle
    ? `"${submissionTitle}"`
    : t("commentNotification.yourWork");

  const previewText = t("commentNotification.previewText", {
    commenterName: commenterName || t("commentNotification.someone"),
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
          💬 {t("commentNotification.title")}
        </Text>
        <EmailText>
          {t("commentNotification.message", {
            commenterName: commenterName || t("commentNotification.someone"),
            titleDisplay,
          })}
        </EmailText>
        <EmailText>{t("commentNotification.description")}</EmailText>
        <Section style={{ marginTop: "28px", textAlign: "center" }}>
          <EmailButton href={submissionUrl}>
            {t("commentNotification.viewWorkButton")}
          </EmailButton>
        </Section>
        <Section style={{ marginTop: "20px", textAlign: "center" }}>
          <Text
            style={{ fontSize: "14px", color: "#6b7280", textAlign: "center" }}
          >
            <a
              href={commenterProfileUrl}
              style={{ color: "#3b82f6", textDecoration: "none" }}
            >
              {t("commentNotification.visitProfile", {
                commenterName:
                  commenterName || t("commentNotification.someone"),
              })}
            </a>
          </Text>
        </Section>
      </Section>
    </BaseEmail>
  );
};
