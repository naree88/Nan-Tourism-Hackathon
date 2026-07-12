import type { Metadata, Viewport } from "next";
import { AppHeader } from "@/components/app-header";
import { BottomNavigation } from "@/components/bottom-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nan Coffee, Please",
    template: "%s · Nan Coffee, Please",
  },
  description:
    "เส้นทางกาแฟน่านที่อธิบายได้ พร้อมข้อมูลร้านสำหรับทำงานและเรื่องใกล้ร้านที่ตรวจสอบที่มา",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4eee3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <a className="skip-link" href="#main-content">
          ข้ามไปเนื้อหาหลัก
        </a>
        <div className="site-shell">
          <AppHeader />
          <main id="main-content">{children}</main>
          <BottomNavigation />
        </div>
      </body>
    </html>
  );
}
