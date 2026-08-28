import "server-only";

export type TransactionalEmail = { to: string; subject: string; text: string; html?: string };
export interface EmailProvider { send(message: TransactionalEmail): Promise<void> }

let testProvider: EmailProvider | undefined;
export function setEmailProviderForTests(provider?: EmailProvider): void { testProvider = provider; }

export async function getEmailProvider(): Promise<EmailProvider> {
  if (testProvider) return testProvider;
  const { createSmtpEmailProvider } = await import("./smtp");
  return createSmtpEmailProvider();
}
