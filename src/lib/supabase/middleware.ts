import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect routes based on user role
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    const role = data?.role

    if (request.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/officer/dashboard', request.url))
    }
    
    if (request.nextUrl.pathname.startsWith('/officer') && role !== 'officer') {
       if (role === 'admin') {
         return NextResponse.redirect(new URL('/admin/dashboard', request.url))
       }
    }
    
    // Redirect logged in users away from login
    if (request.nextUrl.pathname === '/login') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      return NextResponse.redirect(new URL('/officer/dashboard', request.url))
    }
  } else {
    // Not logged in
    if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/officer')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}
