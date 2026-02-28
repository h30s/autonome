import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Autonome — Self-Operating AI Agent",
    description:
        "An autonomous agent that earns USDC by selling AI-powered wallet intelligence, spends on PinionOS skills, and auto-reinvests profits. Built for the PinionOS Hackathon.",
    openGraph: {
        title: "Autonome — Self-Operating AI Agent on PinionOS",
        description:
            "Watch software that runs its own business: earns, spends, profits, and reinvests autonomously on Base.",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
            <body>{children}</body>
        </html>
    );
}
