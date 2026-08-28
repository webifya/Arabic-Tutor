import { appConfig } from "@/config/app";
import { getMessages } from "@/i18n";

export default function Home() {
  const messages = getMessages(appConfig.defaultLocale).foundation;

  return (
    <main className="page-shell">
      <section className="foundation-card">
        <p className="eyebrow">{messages.eyebrow}</p>
        <div className="arabic-mark" lang="ar" dir="rtl" aria-label="Lisan in Arabic">
          لسان
        </div>
        <h1>{messages.heading}</h1>
        <p className="description">{messages.description}</p>
        <p className="status">{messages.status}</p>
      </section>
    </main>
  );
}
