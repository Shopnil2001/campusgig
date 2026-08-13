import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusGigs | Your campus. Your market.",
  description: "A trusted freelance marketplace for university students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
