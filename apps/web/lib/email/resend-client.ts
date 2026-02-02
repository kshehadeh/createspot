import { Resend } from "resend";

let cachedClient: Resend | null = null;

const getApiKey = (): string => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  return apiKey;
};

export const createResendClient = (apiKey: string): Resend =>
  new Resend(apiKey);

export const resendClient = (): Resend => {
  if (!cachedClient) {
    cachedClient = createResendClient(getApiKey());
  }
  return cachedClient;
};

export const resetResendClient = (): void => {
  cachedClient = null;
};

export type ResendClient = ReturnType<typeof resendClient>;
