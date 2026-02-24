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
  /** Deterministic key for safe retries (e.g. "welcome-user/{userId}"). Resend caches for 24h. */
  idempotencyKey?: string;
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

  private isRetryable(error: unknown): boolean {
    const status =
      error && typeof error === "object" && "statusCode" in error
        ? (error as { statusCode?: number }).statusCode
        : undefined;
    return status === 429 || (typeof status === "number" && status >= 500);
  }

  private async executeSend(
    options: SendEmailOptions | PlainEmailOptions,
    attempt = 0,
  ): Promise<EmailSendResult> {
    this.ensureContent(options);

    const maxRetries = 3;
    const baseDelayMs = 1000;

    try {
      const client = this.getClient();
      const from = this.resolveFrom(options.from);
      const payload = {
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
      };
      const sendOptions = options.idempotencyKey
        ? { idempotencyKey: options.idempotencyKey }
        : undefined;

      const response = await client.emails.send(
        payload as Parameters<Resend["emails"]["send"]>[0],
        sendOptions as Parameters<Resend["emails"]["send"]>[1],
      );

      return this.handleResponse(response);
    } catch (error) {
      const shouldRetry = attempt < maxRetries - 1 && this.isRetryable(error);
      if (shouldRetry) {
        const delay =
          Math.min(baseDelayMs * 2 ** attempt, 30000) + Math.random() * 1000;
        await new Promise((r) => setTimeout(r, delay));
        return this.executeSend(options, attempt + 1);
      }
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
