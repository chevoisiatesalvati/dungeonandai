"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Site footer
 */
export const Footer = () => {
  const { theme, setTheme } = useTheme();

  return (
    <footer className="py-4 px-8 border-t border-[#d4af37]/30">
      <div className="flex justify-between items-center">
        <p className="text-[#d4af37]">© 2024 D&AI</p>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-[#d4af37] hover:text-[#d4af37]/80"
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
      </div>
    </footer>
  );
};
