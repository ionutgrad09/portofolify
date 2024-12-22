import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header/Header";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import {ReactNode} from "react";
import ThemeProvider from "@/theme/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portofolify",
  description: "Calculate your compound interest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <AppRouterCacheProvider >
          <ThemeProvider>
            <Header />
              <div className='pl-[10%] pr-[10%]'>
                  {children}
              </div>
          </ThemeProvider>
      </AppRouterCacheProvider>
      </body>
    </html>
  );
}
