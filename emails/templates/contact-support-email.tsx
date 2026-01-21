import { Section, Text, Link } from "@react-email/components";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

export interface ContactSupportEmailProps {
  userName?: string | null;
  description: string;
  pageUrl: string;
  baseUrl?: string;
  userEmail?: string;
  isAdminCopy?: boolean;
}

export const ContactSupportEmail = ({
  userName = "Friend",
  description,
  pageUrl,
  baseUrl,
  userEmail,
  isAdminCopy = false,
}: ContactSupportEmailProps) => {
  const previewText = isAdminCopy
    ? `Bug report from ${userName}`
    : "We received your bug report";

  return (
    <BaseEmail previewText={previewText} baseUrl={baseUrl}>
      <Section>
        <Text style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>
          {isAdminCopy
            ? `Bug Report from ${userName}`
            : `Thank you for reporting a bug, ${userName}!`}
        </Text>
        <EmailText>
          {isAdminCopy
            ? "A user has submitted a bug report. Please review the details below."
            : "We received your bug report and appreciate you helping us improve Create Spot. Our team will review the details and investigate the issue as soon as possible."}
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
          {isAdminCopy && userEmail && (
            <Text style={{ fontSize: "14px", margin: "8px 0" }}>
              <strong>Reporter:</strong> {userName} (
              <Link href={`mailto:${userEmail}`}>{userEmail}</Link>)
            </Text>
          )}
          <Text style={{ fontSize: "14px", margin: "8px 0" }}>
            <strong>Page URL:</strong>{" "}
            <Link href={pageUrl}>{pageUrl}</Link>
          </Text>
          <Text style={{ fontSize: "14px", margin: "8px 0" }}>
            <strong>Description:</strong>
          </Text>
          <Text style={{ fontSize: "14px", margin: "8px 0", whiteSpace: "pre-wrap" }}>
            {description}
          </Text>
        </Section>

        {!isAdminCopy && (
          <EmailText>
            If you have any additional details to add or would like to provide
            more information, please feel free to reach out to us.
          </EmailText>
        )}
      </Section>
    </BaseEmail>
  );
};
