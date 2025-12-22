import React, { createContext, useContext, useEffect, useState } from "react"

const initialState = {
    theme: "system",
    effectiveTheme: "light",
    setTheme: () => null,
}

const ThemeProviderContext = createContext(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}) {
    const [theme, setTheme] = useState(
        () => localStorage.getItem(storageKey) || defaultTheme
    )
    const [effectiveTheme, setEffectiveTheme] = useState("light")

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            setEffectiveTheme(systemTheme)

            // Listen for system theme changes
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
            const handleChange = (e) => {
                const newTheme = e.matches ? "dark" : "light"
                root.classList.remove("light", "dark")
                root.classList.add(newTheme)
                setEffectiveTheme(newTheme)
            }
            mediaQuery.addEventListener("change", handleChange)
            return () => mediaQuery.removeEventListener("change", handleChange)
        }

        root.classList.add(theme)
        setEffectiveTheme(theme)
    }, [theme])

    const value = {
        theme,
        effectiveTheme,
        setTheme: (newTheme) => {
            localStorage.setItem(storageKey, newTheme)
            setTheme(newTheme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
