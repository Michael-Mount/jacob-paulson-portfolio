import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { League_Spartan } from "next/font/google";

import Navbar from "./components/Navbar";
import ScollIndicator from "./components/ScrollIndicator";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-league",
  display: "swap",
});

export const metadata = {
  title: "Jacob Paulson",
  description:
    "Jacob Paulsons audio engineering portfolio website. This site is designed to house the latest works from Jacob Paulson as an audio engineer and to highlight his strengths as well as a place for clients to get in contact with him.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={leagueSpartan.variable}>
      <body>
        <Navbar />
        <ScollIndicator targetId="main" />
        {children}
      </body>
    </html>
  );
}
