import type { ReactNode } from "react";
import type { Resend } from "resend";
import { resendClient } from "./resend-client";

type EmailAddress = string | string[];

export interface EmailTag {
  name: string;
  value: string;
}

export interface BaseEmailOptions {
  to: EmailAddress;
  subject: string;
  from?: string;
  cc?: EmailAddress;
  bcc?: EmailAddress;
  replyTo?: EmailAddress;
  tags?: EmailTag[];
  headers?: Record<string, string>;
  text?: string;
}

export interface SendEmailOptions extends BaseEmailOptions {
  react?: ReactNode;
}

export interface PlainEmailOptions extends BaseEmailOptions {
  react?: never;
  text: string;
}

export interface EmailSendResult {
  id: string;
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly metadata?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "EmailSendError";
  }
}

type ResendEmailsSendResponse = Awaited<ReturnType<Resend["emails"]["send"]>>;

export class EmailService {
  constructor(private readonly clientFactory: () => Resend = resendClient) {}

  private getClient(): Resend {
    try {
      return this.clientFactory();
    } catch (error) {
      throw new EmailSendError("RESEND_API_KEY is not configured.", undefined, {
        cause: error,
      });
    }
  }

  private resolveFrom(from?: string): string {
    const resolved = from ?? process.env.RESEND_FROM_EMAIL;
    if (!resolved) {
      throw new EmailSendError("RESEND_FROM_EMAIL is not configured.");
    }
    return resolved;
  }

  private ensureContent(options: SendEmailOptions | PlainEmailOptions): void {
    if (!options.react && !options.text) {
      throw new EmailSendError(
        "Email content missing. Provide either `react` or `text`.",
      );
    }
  }

  private async executeSend(
    options: SendEmailOptions | PlainEmailOptions,
  ): Promise<EmailSendResult> {
    this.ensureContent(options);

    try {
      const client = this.getClient();
      const from = this.resolveFrom(options.from);
      const response = await client.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        react: options.react,
        text: options.text,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        tags: options.tags,
        headers: options.headers,
      });

      return this.handleResponse(response);
    } catch (error) {
      throw new EmailSendError(
        "Failed to send email via Resend.",
        { attemptedTo: options.to },
        { cause: error },
      );
    }
  }

  private handleResponse(response: ResendEmailsSendResponse): EmailSendResult {
    if (response.error) {
      throw new EmailSendError(response.error.message, {
        name: response.error.name,
        statusCode: response.error.statusCode,
      });
    }
    if (!response.data) {
      throw new EmailSendError("Resend returned an empty response.");
    }
    return response.data;
  }

  /**
   * Sends a JSX email using React Email templates.
   *
   * @example
   * await emailService.sendReactEmail({
   *   to: user.email,
   *   subject: "Welcome to Prompts",
   *   react: <WelcomeEmail name={user.name} />,
   * });
   */
  async sendReactEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    return this.executeSend(options);
  }

  async sendPlainEmail(options: PlainEmailOptions): Promise<EmailSendResult> {
    return this.executeSend(options);
  }
}

export const emailService = new EmailService();

export const sendEmail = (
  options: SendEmailOptions,
): Promise<EmailSendResult> => emailService.sendReactEmail(options);

export const sendPlainEmail = (
  options: PlainEmailOptions,
): Promise<EmailSendResult> => emailService.sendPlainEmail(options);
