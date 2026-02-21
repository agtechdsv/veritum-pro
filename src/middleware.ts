import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // refresh session if expired
    const { data: { user } } = await supabase.auth.getUser()

    // Define paths
    const path = request.nextUrl.pathname
    const isPublicPath = path === '/' || path === '/login' || path === '/pricing' ||
        path === '/privacy' || path === '/terms' || path.startsWith('/auth') ||
        ['/sentinel', '/nexus', '/scriptor', '/valorem', '/cognitio', '/vox'].includes(path)
    const isSetupPath = path === '/setup'

    // 1. If user is NOT logged in (Master DB)
    if (!user) {
        // Allow public paths
        if (isPublicPath) {
            return response
        }
        // Redirect others to login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. If user IS logged in
    if (user) {
        // If trying to access Login while logged in, go to Dashboard (or Setup check)
        if (path === '/login') {
            return NextResponse.redirect(new URL('/veritum', request.url))
        }

        // Check if BYODB keys exist in cookies (Disabled for now as requested)
        /*
        const hasByodbKeys = request.cookies.has('sb-project-url') && request.cookies.has('sb-anon-key')

        if (!hasByodbKeys && !isSetupPath && !isPublicPath) {
            // Logged in but no BYODB keys -> Setup
            return NextResponse.redirect(new URL('/setup', request.url))
        }
        */
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
