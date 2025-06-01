"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export const SwitchTheme = ({ className }: { className?: string }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = resolvedTheme === "dark";

  const handleToggle = () => {
    if (isDarkMode) {
      setTheme("light");
      return;
    }
    setTheme("dark");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleToggle}
        className="border border-white/20 rounded-full p-2 hover:border-white/40 transition-colors"
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun className="h-5 w-5 text-[#d4af37]" /> : <Moon className="h-5 w-5 text-[#d4af37]" />}
      </button>
    </div>
  );
};
