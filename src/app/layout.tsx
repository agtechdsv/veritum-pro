import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VERITUM PRO | Ecossistema Jurídico Inteligente",
  description: "A plataforma definitiva para gestão jurídica com IA integrada, BYODB e alta performance.",
  verification: {
    google: "9HMAIsbuVkMxdSkoKStJ1Bsu4kzHrIfwMJFfjrOf7mc",
  },
};

import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/contexts/language-context"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            storageKey="veritum-theme"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </LanguageProvider>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.trustedTypes && window.trustedTypes.createPolicy) {
                if (!window.trustedTypes.defaultPolicy) {
                  window.trustedTypes.createPolicy('default', {
                    createHTML: (string) => string,
                    createScriptURL: (string) => string,
                    createScript: (string) => string,
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
