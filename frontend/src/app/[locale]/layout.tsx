import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const locales = ["tr", "en"];

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";
  return {
    title: {
      template: "%s | ArabaIQ",
      default: "ArabaIQ",
    },
    description: isTr
      ? "Veriye dayalı araç önerileri ve karşılaştırma."
      : "Data-driven car recommendations and comparison.",
  };
}

async function getMessages(locale: string) {
  try {
    return (await import(`@/i18n/messages/${locale}.json`)).default;
  } catch {
    notFound();
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header messages={messages.common} />
      <main className="flex-1">{children}</main>
      <Footer messages={messages.footer} locale={locale} />
    </div>
  );
}
