import { Img, Section, Text } from "@react-email/components";
import { EmailButton } from "@/emails/components/button";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

interface BadgeAwardEmailProps {
  badgeName: string;
  badgeDescription: string;
  badgeImage: string;
  profileUrl: string;
  baseUrl: string;
  userId: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const BadgeAwardEmail = ({
  badgeName,
  badgeDescription,
  badgeImage,
  profileUrl,
  baseUrl,
  userId,
  t,
}: BadgeAwardEmailProps) => {
  const previewText = t("badgeAward.preview", { badgeName });
  const logoUrl = `${baseUrl}/images/create-spot-logo-white-rectangle.png`;

  return (
    <BaseEmail previewText={previewText} userId={userId} baseUrl={baseUrl} t={t}>
      <Section style={{ marginBottom: "24px", textAlign: "center" }}>
        <Img
          src={logoUrl}
          alt="Create Spot"
          width="120"
          height="131"
          style={{ margin: "0 auto" }}
        />
      </Section>
      <Section style={{ textAlign: "center" }}>
        <Text style={{ fontSize: "22px", fontWeight: 600, marginBottom: "12px" }}>
          🏅 {t("badgeAward.title", { badgeName })}
        </Text>
        <Img
          src={`${baseUrl}${badgeImage}`}
          alt={badgeName}
          width="160"
          height="160"
          style={{ margin: "0 auto", borderRadius: "16px" }}
        />
        <Text
          style={{
            color: "#111827",
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: "26px",
            margin: "16px 0 8px",
            textAlign: "center",
          }}
        >
          {badgeName}
        </Text>
        <EmailText align="center">{badgeDescription}</EmailText>
        <Section style={{ marginTop: "20px" }}>
          <EmailButton href={profileUrl}>{t("badgeAward.viewProfile")}</EmailButton>
        </Section>
      </Section>
    </BaseEmail>
  );
};
