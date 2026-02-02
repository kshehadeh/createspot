import { Section, Text, Link } from "@react-email/components";
import { EmailText } from "@/emails/components/text";
import { BaseEmail } from "@/emails/layouts/base-email";

interface Submission {
  id: string;
  title: string | null;
  user: {
    name: string | null;
    email: string;
  };
}

export interface ExhibitRequestEmailProps {
  requesterName: string;
  requesterEmail: string;
  exhibitName: string;
  exhibitDescription: string;
  submissions: Submission[];
  baseUrl?: string;
}

export const ExhibitRequestEmail = ({
  requesterName,
  requesterEmail,
  exhibitName,
  exhibitDescription,
  submissions,
  baseUrl,
}: ExhibitRequestEmailProps) => {
  const previewText = `New exhibit request: ${exhibitName}`;

  return (
    <BaseEmail previewText={previewText} baseUrl={baseUrl}>
      <Section>
        <Text
          style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}
        >
          New Exhibit Request
        </Text>

        <Section
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            padding: "16px",
            margin: "24px 0",
          }}
        >
          <Text
            style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}
          >
            REQUESTER INFORMATION
          </Text>
          <Text style={{ fontSize: "14px", margin: "8px 0" }}>
            <strong>Name:</strong> {requesterName}
          </Text>
          <Text style={{ fontSize: "14px", margin: "8px 0" }}>
            <strong>Email:</strong>{" "}
            <Link href={`mailto:${requesterEmail}`}>{requesterEmail}</Link>
          </Text>
        </Section>

        <Section
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            padding: "16px",
            margin: "24px 0",
          }}
        >
          <Text
            style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}
          >
            EXHIBIT DETAILS
          </Text>
          <Text style={{ fontSize: "14px", margin: "8px 0" }}>
            <strong>Exhibit Name:</strong> {exhibitName}
          </Text>
          <Text style={{ fontSize: "14px", margin: "8px 0" }}>
            <strong>Description:</strong>
          </Text>
          <Text
            style={{
              fontSize: "14px",
              margin: "8px 0",
              whiteSpace: "pre-wrap",
            }}
          >
            {exhibitDescription}
          </Text>
        </Section>

        <Section
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            padding: "16px",
            margin: "24px 0",
          }}
        >
          <Text
            style={{ fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}
          >
            SUBMISSIONS ({submissions.length})
          </Text>
          {submissions.map((submission) => {
            const submissionUrl = baseUrl
              ? `${baseUrl}/s/${submission.id}`
              : undefined;

            return (
              <Section key={submission.id} style={{ marginBottom: "12px" }}>
                <Text style={{ fontSize: "14px", margin: "4px 0" }}>
                  <strong>
                    {submissionUrl ? (
                      <Link href={submissionUrl}>
                        {submission.title || "Untitled"}
                      </Link>
                    ) : (
                      submission.title || "Untitled"
                    )}
                  </strong>
                </Text>
                <Text
                  style={{
                    fontSize: "12px",
                    margin: "4px 0",
                    color: "#6b7280",
                  }}
                >
                  By {submission.user.name || "Anonymous"} (
                  <Link href={`mailto:${submission.user.email}`}>
                    {submission.user.email}
                  </Link>
                  )
                </Text>
              </Section>
            );
          })}
        </Section>

        <EmailText>
          Please review this exhibit request and follow up with the requester if
          you need any additional information.
        </EmailText>
      </Section>
    </BaseEmail>
  );
};
