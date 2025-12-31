"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function Navbar() {
  const scrollToSection = () => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="bg-background flex flex-row items-left justify-start gap-9 text-secondary text-2xl p-9">
      <button onClick={() => scrollToSection("player")}>
        <img
          src="/images/white-logo.jpg"
          alt="white logo with text saying jacop paulson"
          className="h-[144px] w-auto"
        />
      </button>

      <button onClick={() => scrollToSection("player")}>About</button>
      <button onClick={() => scrollToSection("player")}>Contact</button>
    </nav>
  );
}
