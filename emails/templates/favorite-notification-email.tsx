import { Img, Section, Text } from "@react-email/components";
import { EmailButton } from "@/emails/components/button";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface FavoriteNotificationEmailProps {
  favorerName?: string | null;
  submissionTitle?: string | null;
  submissionUrl: string;
  favorerProfileUrl: string;
  baseUrl: string;
  userId: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const FavoriteNotificationEmail = ({
  favorerName = "Someone",
  submissionTitle,
  submissionUrl,
  favorerProfileUrl,
  baseUrl,
  userId,
  t,
}: FavoriteNotificationEmailProps) => {
  const titleDisplay = submissionTitle
    ? `"${submissionTitle}"`
    : t("favoriteNotification.yourWork");

  const previewText = t("favoriteNotification.previewText", {
    favorerName: favorerName || t("favoriteNotification.someone"),
    titleDisplay,
  });

  const logoUrl = `${baseUrl}/images/create-spot-logo-white-rectangle.png`;

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
          ❤️ {t("favoriteNotification.title")}
        </Text>
        <EmailText>
          {t("favoriteNotification.message", {
            favorerName: favorerName || t("favoriteNotification.someone"),
            titleDisplay,
          })}
        </EmailText>
        <EmailText>
          {t("favoriteNotification.description")}
        </EmailText>
        <Section style={{ marginTop: "28px", textAlign: "center" }}>
          <EmailButton href={submissionUrl}>
            {t("favoriteNotification.viewWorkButton")}
          </EmailButton>
        </Section>
        <Section style={{ marginTop: "20px", textAlign: "center" }}>
          <Text style={{ fontSize: "14px", color: "#6b7280", textAlign: "center" }}>
            <a href={favorerProfileUrl} style={{ color: "#3b82f6", textDecoration: "none" }}>
              {t("favoriteNotification.visitProfile", {
                favorerName: favorerName || t("favoriteNotification.someone"),
              })}
            </a>
          </Text>
        </Section>
      </Section>
    </BaseEmail>
  );
};
