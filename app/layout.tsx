import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "회의 시간 조율",
  description: "팀 회의 가능 시간 수집 및 결과 확인",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
