import { Img, Section, Text } from "@react-email/components";
import { EmailButton } from "@/emails/components/button";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface NewFollowerPostEmailProps {
  creatorName?: string | null;
  submissionTitle?: string | null;
  submissionUrl: string;
  creatorProfileUrl: string;
  baseUrl: string;
  userId: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const NewFollowerPostEmail = ({
  creatorName = "A creator you follow",
  submissionTitle,
  submissionUrl,
  creatorProfileUrl,
  baseUrl,
  userId,
  t,
}: NewFollowerPostEmailProps) => {
  const titleDisplay = submissionTitle
    ? `"${submissionTitle}"`
    : t("newFollowerPost.newWork");

  const previewText = t("newFollowerPost.previewText", {
    creatorName: creatorName || t("newFollowerPost.someone"),
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
          ✨ {t("newFollowerPost.title")}
        </Text>
        <EmailText>
          {t("newFollowerPost.message", {
            creatorName: creatorName || t("newFollowerPost.someone"),
            titleDisplay,
          })}
        </EmailText>
        <EmailText>{t("newFollowerPost.description")}</EmailText>
        <Section style={{ marginTop: "28px", textAlign: "center" }}>
          <EmailButton href={submissionUrl}>
            {t("newFollowerPost.viewWorkButton")}
          </EmailButton>
        </Section>
        <Section style={{ marginTop: "20px", textAlign: "center" }}>
          <Text
            style={{ fontSize: "14px", color: "#6b7280", textAlign: "center" }}
          >
            <a
              href={creatorProfileUrl}
              style={{ color: "#3b82f6", textDecoration: "none" }}
            >
              {t("newFollowerPost.visitProfile", {
                creatorName: creatorName || t("newFollowerPost.someone"),
              })}
            </a>
          </Text>
        </Section>
      </Section>
    </BaseEmail>
  );
};
