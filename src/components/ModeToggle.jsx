import React, { useState, useEffect, useRef } from "react"
import { Moon, Sun, Laptop, Check } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export function ModeToggle() {
    const { theme, effectiveTheme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleSetTheme = (newTheme) => {
        setTheme(newTheme)
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative inline-flex items-center justify-center rounded-md w-9 h-9 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-gray-200 dark:border-gray-800 bg-transparent shadow-sm"
                aria-label="Toggle theme"
            >
                <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${effectiveTheme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
                <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${effectiveTheme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-32 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-200 p-1">
                    <button
                        onClick={() => handleSetTheme("light")}
                        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 ${theme === 'light' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light</span>
                        {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                    </button>
                    <button
                        onClick={() => handleSetTheme("dark")}
                        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark</span>
                        {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                    </button>
                    <button
                        onClick={() => handleSetTheme("system")}
                        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 ${theme === 'system' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                        <Laptop className="mr-2 h-4 w-4" />
                        <span>System</span>
                        {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
                    </button>
                </div>
            )}
        </div>
    )
}
