import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

/**
 * Poppins is the only typeface in the brand — no monospace, no fallback face.
 * 400 for body, 600 for section headers and labels, 700 for titles.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DASC513 — Tutorial Activities",
    template: "%s · DASC513",
  },
  description:
    "Four escape-room tutorials auditing a fictional health-AI company for bias, transparency, privacy and uncertainty.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-navy">
        {children}
      </body>
    </html>
  );
}
