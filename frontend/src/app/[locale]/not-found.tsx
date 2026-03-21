import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-extrabold text-[#2563eb] mb-4">404</h1>
        <p className="text-xl text-[#6b7280] mb-8">Sayfa bulunamadı / Page not found</p>
        <Link
          href="/tr"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563eb] text-white font-medium hover:bg-[#1d4ed8] transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
