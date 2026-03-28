"use client";

interface FooterProps {
  messages: Record<string, string>;
  locale: string;
}

export default function Footer({ messages }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#020617]">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 text-center">
        <div className="inline-flex items-center gap-1 mb-4">
          <span className="font-display text-sm font-extrabold tracking-wide uppercase">
            <span className="text-white">Araba</span>
            <span className="gradient-text-brand">IQ</span>
          </span>
        </div>
        <p className="text-sm text-[#9CA3AF] mb-2">{messages.tagline}</p>
        <p className="text-xs text-[#6B7280]">© {new Date().getFullYear()} ArabaIQ — {messages.rights}</p>
      </div>
    </footer>
  );
}
