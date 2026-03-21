"use client";

interface FooterProps {
  messages: Record<string, string>;
  locale: string;
}

export default function Footer({ messages }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-[#d1d5db]/40 bg-white/80">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 text-center">
        <p className="text-sm text-[#0d1117]/75 mb-2">{messages.tagline}</p>
        <p className="text-xs text-[#6b7280]">© {new Date().getFullYear()} ArabaIQ — {messages.rights}</p>
      </div>
    </footer>
  );
}
