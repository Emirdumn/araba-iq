"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

interface HeaderProps {
  messages: Record<string, string>;
}

export default function Header({ messages }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params?.locale as string) || "tr";

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const switchLang = (code: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${code}`);
    router.push(newPath);
    setLangOpen(false);
    setMenuOpen(false);
  };

  const navLinks = [
    { href: `/${locale}`, label: messages.home },
    { href: `/${locale}/recommendations`, label: messages.navRecommendations },
    { href: `/${locale}/compare`, label: messages.navCompare },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#d1d5db]/60 shadow-sm">
        <div className="px-6 lg:px-10">
          <div className="flex items-center justify-between h-14 lg:h-16">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-3 text-[#0d1117] group"
              aria-expanded={menuOpen}
            >
              <div className="flex flex-col gap-[5px]">
                <span className="block w-5 h-[1.5px] bg-[#0d1117] group-hover:w-6 transition-all duration-300" />
                <span className="block w-3 h-[1.5px] bg-[#0d1117] group-hover:w-6 transition-all duration-300" />
              </div>
              <span className="text-[13px] font-medium tracking-wide hidden sm:inline">{messages.menu}</span>
            </button>

            <Link href={`/${locale}`} className="absolute left-1/2 -translate-x-1/2">
              <span className="font-display text-[18px] sm:text-[20px] font-extrabold tracking-[0.04em] uppercase">
                <span className="text-[#0d1117]">Araba</span>
                <span className="text-[#2563eb]">IQ</span>
              </span>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[#2563eb]/8 text-[#0d1117]"
                aria-expanded={langOpen}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">{locale}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-lg border border-[#d1d5db] min-w-[140px] z-50">
                  {LOCALES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => switchLang(l.code)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-[#f4f5f7] flex items-center gap-2",
                        locale === l.code && "bg-[#2563eb]/8 font-semibold text-[#2563eb]",
                      )}
                    >
                      <span>{l.flag}</span> {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center px-6 py-5 border-b border-[#d1d5db]/40">
            <span className="font-display text-lg font-extrabold tracking-wide">
              <span className="text-[#0d1117]">Araba</span>
              <span className="text-[#2563eb]">IQ</span>
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-[#6b7280] hover:text-[#0d1117] transition-colors"
            >
              ✕
            </button>
          </div>
          <nav className="flex-1 flex flex-col justify-center px-8 gap-2">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="group flex items-center gap-4 py-4 border-b border-[#e5e7eb]"
              >
                <span className="text-xs font-mono text-[#2563eb]">{(i + 1).toString().padStart(2, "0")}</span>
                <span className="text-2xl font-light text-[#0d1117] group-hover:text-[#2563eb] transition-colors">
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
