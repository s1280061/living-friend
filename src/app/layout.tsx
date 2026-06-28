import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Living Friend",
  description: "Talk to a friend who actually lives a life.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-haru-bg text-[#2b2b2b]">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">{children}</div>
      </body>
    </html>
  );
}
