import { Section, Text } from "@react-email/components";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface ContactSupportEmailProps {
  userName?: string | null;
  description: string;
  pageUrl: string;
  baseUrl?: string;
}

export const ContactSupportEmail = ({
  userName = "Friend",
  description,
  pageUrl,
  baseUrl,
}: ContactSupportEmailProps) => {
  const previewText = "We received your bug report";

  return (
    <BaseEmail previewText={previewText} baseUrl={baseUrl}>
      <Section>
        <Text style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>
          Thank you for reporting a bug, {userName}!
        </Text>
        <EmailText>
          We received your bug report and appreciate you helping us improve
          Create Spot. Our team will review the details and investigate the
          issue as soon as possible.
        </EmailText>

        <Section
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            padding: "16px",
            margin: "24px 0",
          }}
        >
          <Text style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>
            BUG REPORT DETAILS
          </Text>
          <Text style={{ fontSize: "14px", margin: "8px 0" }}>
            <strong>Page URL:</strong> {pageUrl}
          </Text>
          <Text style={{ fontSize: "14px", margin: "8px 0" }}>
            <strong>Description:</strong>
          </Text>
          <Text style={{ fontSize: "14px", margin: "8px 0", whiteSpace: "pre-wrap" }}>
            {description}
          </Text>
        </Section>

        <EmailText>
          If you have any additional details to add or would like to provide
          more information, please feel free to reach out to us.
        </EmailText>
      </Section>
    </BaseEmail>
  );
};
