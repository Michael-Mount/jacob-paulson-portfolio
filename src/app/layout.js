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
    "Jacob Paulsons audio engerineering portfolio website. This site is design to hosue the latest works from Jacob Paulson as a music enenerr and to highlight his stregths as well as a place for clients to get in contact with him.",
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
