import { describe, expect, it } from "vitest";
import { appConfig } from "@/config/app";
import { getMessages } from "@/i18n";

describe("application foundation", () => {
  it("uses supported centralized branding and locale settings", () => {
    expect(appConfig.appName).toBeTruthy();
    expect(["bn", "en"]).toContain(appConfig.defaultLocale);
  });

  it("provides complete messages for both initial UI locales", () => {
    expect(getMessages("bn").foundation.heading).toBeTruthy();
    expect(getMessages("en").foundation.heading).toBeTruthy();
  });
});
