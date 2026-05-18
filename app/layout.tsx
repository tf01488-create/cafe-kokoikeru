import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "カフェ混雑情報 - ここいける？",
  description: "カフェのリアルタイム混雑情報をユーザーが共有するサービス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-amber-50 min-h-screen">
        <header className="bg-amber-800 text-white shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-wide">
              ☕ ここいける？
            </a>
            <a
              href="/post"
              className="bg-white text-amber-800 font-semibold px-4 py-2 rounded-full text-sm hover:bg-amber-100 transition"
            >
              混雑を報告する
            </a>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        <footer className="text-center text-amber-700 text-xs py-6 mt-8">
          © 2026 ここいける？ — カフェ混雑情報共有サービス
        </footer>
      </body>
    </html>
  );
}
