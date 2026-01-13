import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worksphere",
  description: "Hệ thống quản lý công việc chuyên nghiệp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
