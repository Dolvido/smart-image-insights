import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Image Insights | AI-Powered Image Analysis",
  description: "Upload your images and get instant AI-powered analysis, object detection, and interactive Q&A.",
  keywords: ["AI", "image analysis", "object detection", "computer vision", "machine learning"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0F1E] antialiased">
        {children}
      </body>
    </html>
  );
}
