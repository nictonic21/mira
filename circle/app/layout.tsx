import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Circle",
  description:
    "A private log of your friendships — see which ones feed you and which ones drain you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
