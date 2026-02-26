"use client"

import * as React from "react"
import { useTheme, ThemeProvider as NextThemesProvider } from "next-themes"
import { createMasterClient } from "@/lib/supabase/master"

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            <ThemeSync>{children}</ThemeSync>
        </NextThemesProvider>
    )
}

function ThemeSync({ children }: { children: React.ReactNode }) {
    // Theme sync with DB removed for better UX. 
    // next-themes handles LocalStorage automatically.
    return <>{children}</>
}
