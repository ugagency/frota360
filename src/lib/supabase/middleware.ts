import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

const PUBLIC_PATHS = ['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha', '/landing']
// rotas onde estar autenticado NÃO redireciona pra dashboard (ex.: callback de reset)
const ALLOW_WHEN_AUTHED = ['/redefinir-senha', '/landing']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: getUser() faz o refresh do token. Não remover.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? '/landing' : '/login'
    return NextResponse.redirect(url)
  }

  const allowAuthed = ALLOW_WHEN_AUTHED.some((p) => pathname.startsWith(p))
  if (user && isPublic && !allowAuthed) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}
