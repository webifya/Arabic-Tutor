export const supportedLocales = ["bn", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

export type Messages = {
  foundation: {
    eyebrow: string;
    heading: string;
    description: string;
    status: string;
  };
};
