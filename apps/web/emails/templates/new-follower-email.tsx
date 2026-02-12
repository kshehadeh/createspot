import { Img, Section, Text } from "@react-email/components";
import { EmailButton } from "@/emails/components/button";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface NewFollowerEmailProps {
  followerName?: string | null;
  followerProfileUrl: string;
  baseUrl: string;
  userId: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const NewFollowerEmail = ({
  followerName = "Someone",
  followerProfileUrl,
  baseUrl,
  userId,
  t,
}: NewFollowerEmailProps) => {
  const previewText = t("newFollower.previewText", {
    followerName: followerName || t("newFollower.someone"),
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
          👋 {t("newFollower.title")}
        </Text>
        <EmailText>
          {t("newFollower.message", {
            followerName: followerName || t("newFollower.someone"),
          })}
        </EmailText>
        <EmailText>{t("newFollower.description")}</EmailText>
        <Section style={{ marginTop: "28px", textAlign: "center" }}>
          <EmailButton href={followerProfileUrl}>
            {t("newFollower.viewProfileButton")}
          </EmailButton>
        </Section>
      </Section>
    </BaseEmail>
  );
};
