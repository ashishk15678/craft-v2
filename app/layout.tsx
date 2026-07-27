import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCProvider } from "@/lib/trpc/provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Craft — Learn by building", template: "%s · Craft" },
  description: "A collaborative learning platform for organizations, teachers, and students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TRPCProvider>
            {children}
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
