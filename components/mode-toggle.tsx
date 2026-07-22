"use client"
import { DarkModeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";

export default function ToggleTheme() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => {
        setTheme(theme === "dark" ? "light" : "dark");
      }}
    >
      <HugeiconsIcon icon={DarkModeIcon} className="text-primary" />
    </button>
  );
}
