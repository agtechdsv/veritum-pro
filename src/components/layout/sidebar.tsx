'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    ShieldAlert, // Sentinel
    KanbanSquare, // Nexus
    FileText, // Scriptor
    DollarSign, // Valorem
    BarChart3, // Cognitio
    MessageSquareText, // Vox
    Settings,
    Database,
    LayoutDashboard
} from 'lucide-react'

const routes = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/',
        color: 'text-sky-500',
    },
    {
        label: 'Sentinel Pro',
        icon: ShieldAlert,
        href: '/sentinel',
        color: 'text-violet-500',
    },
    {
        label: 'Nexus Pro',
        icon: KanbanSquare,
        href: '/nexus',
        color: 'text-pink-700',
    },
    {
        label: 'Scriptor Pro',
        icon: FileText,
        href: '/scriptor',
        color: 'text-orange-700',
    },
    {
        label: 'Valorem Pro',
        icon: DollarSign,
        href: '/valorem',
        color: 'text-emerald-500',
    },
    {
        label: 'Cognitio Pro',
        icon: BarChart3,
        href: '/cognitio',
        color: 'text-green-700',
    },
    {
        label: 'Vox Clientis',
        icon: MessageSquareText,
        href: '/vox',
        color: 'text-blue-700',
    },
    {
        label: 'Settings',
        icon: Settings,
        href: '/settings',
    },
    {
        label: 'Database Setup',
        icon: Database,
        href: '/setup/database',
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        {/* Logo placeholder */}
                        <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-75 blur-sm" />
                        <div className="relative w-full h-full bg-blue-500 rounded-lg flex items-center justify-center">
                            V
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">
                        Veritum Pro
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
