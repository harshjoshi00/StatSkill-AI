import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "StatSkill AI - Skill Intelligence & Personalized Learning Platform",
  description: "AI-Powered Skill Intelligence and Capacity Building Platform for India's Official Statistical System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-[#f8fafc] text-slate-900 dark:bg-[#090d16] dark:text-slate-100 flex flex-col min-h-screen antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-150">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
