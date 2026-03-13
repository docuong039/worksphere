import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/UI/Toaster";
import { ConfirmProvider } from "@/providers/confirm-provider";

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
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ConfirmProvider>
          {children}
          <Toaster />
        </ConfirmProvider>
      </body>
    </html>
  );
}
