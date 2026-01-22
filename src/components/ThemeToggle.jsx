import React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export function ThemeToggle({ className }) {
    const { theme, effectiveTheme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
            aria-label="Toggle theme"
        >
            {effectiveTheme === 'dark' ? (
                <Moon className="h-[1.2rem] w-[1.2rem] text-white" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] text-gray-700" />
            )}
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
