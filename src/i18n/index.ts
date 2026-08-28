import { bn } from "./messages/bn";
import { en } from "./messages/en";
import type { Locale, Messages } from "./types";

const messages: Record<Locale, Messages> = { bn, en };

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
