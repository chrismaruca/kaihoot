import type { Metadata } from "next";
import { Geist, Geist_Mono, Play } from "next/font/google";
import "../styles/globals.css";
import { PlayerProvider } from "@/context/PlayerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kaihoot - Interactive Quiz Game",
  description: "A real-time interactive quiz game platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <PlayerProvider>
          <main>{children}</main>
        </PlayerProvider>
      </body>
    </html>
  );
}
