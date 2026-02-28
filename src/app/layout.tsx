import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Autonome — Self-Operating AI Agent",
    description:
        "An autonomous agent that earns USDC by selling AI-powered wallet intelligence, spends on PinionOS skills, and auto-reinvests profits. Built for the PinionOS Hackathon.",
    openGraph: {
        title: "Autonome — Self-Operating AI Agent on PinionOS",
        description:
            "Watch software that runs its own business: earns, spends, profits, and reinvests autonomously on Base.",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
