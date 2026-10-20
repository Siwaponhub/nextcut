import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const sans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextCut",
  description: "จัดวางรูปบนกระดาษ 10×15 ซม. แล้วพิมพ์ตัดตามขนาด",
  appleWebApp: { capable: true, title: "NextCut", statusBarStyle: "default" },
};

/** viewportFit cover ให้แอปเต็มจอ iPhone แล้วเว้นขอบด้วย env(safe-area-inset-*) เอง */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171c18" },
  ],
};

/** โครง HTML ของทุกหน้า: ฟอนต์ไทย และ script ตั้งธีมก่อนวาดหน้าเพื่อไม่ให้จอกระพริบ */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
