import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import ChatWidget from "./ChatWidget";

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
});

const serif = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-serif",
});

const title = "Bryan Guner — Web Developer";
const description =
  "Portfolio of Bryan Guner, a frontend developer in Weehawken, New Jersey working with React and Next.js.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bgoonz.github.io/VibeCoding/"),
  title,
  description,
  openGraph: {
    title,
    description,
    url: "./",
    siteName: "Bryan Guner",
    type: "profile",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className={sans.className}>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
