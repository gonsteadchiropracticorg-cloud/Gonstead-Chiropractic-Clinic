import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// POST /api/staff/login
// Validates staff credentials against the staff_accounts table.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const password = typeof body?.password === 'string' ? body.password : ''
    const identifierRaw =
      typeof body?.username === 'string'
        ? body.username
        : typeof body?.email === 'string'
        ? body.email
        : typeof body?.identifier === 'string'
        ? body.identifier
        : ''
    const identifier = identifierRaw.trim()

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 },
      )
    }

    let { data, error } = await supabaseAdmin
      .from('staff_accounts')
      .select('*')
      .eq('username', identifier)
      .eq('active', true)
      .maybeSingle()

    // Support login with email as well as username.
    if (!data && !error && identifier.includes('@')) {
      const byEmail = await supabaseAdmin
        .from('staff_accounts')
        .select('*')
        .eq('email', identifier)
        .eq('active', true)
        .maybeSingle()

      data = byEmail.data
      error = byEmail.error
    }

    if (error) {
      console.error('Error fetching staff account:', error)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 },
      )
    }

    let authenticated = false

    // Primary path: table-based credential check (legacy/internal flow).
    if (typeof (data as any).password === 'string' && (data as any).password.length > 0) {
      authenticated = (data as any).password === password
    }

    // Fallback path: Supabase Auth email/password check.
    // This handles deployments where staff_accounts has no password column.
    if (!authenticated) {
      const emailForAuth = ((data as any).email || '').trim()
      if (emailForAuth) {
        const authRes = await supabaseAdmin.auth.signInWithPassword({
          email: emailForAuth,
          password,
        })
        if (!authRes.error && authRes.data?.user) {
          authenticated = true
        }
      }
    }

    if (!authenticated) {
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 },
      )
    }

    // Update last_login_at for audit/visibility
    await supabaseAdmin
      .from('staff_accounts')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.id)

    // Only return non-sensitive fields to the client
    const safe = {
      id: data.id,
      username: data.username as string,
      display_name: (data as any).display_name ?? null,
      role: (data as any).role ?? 'staff',
      active: !!data.active,
    }

    return NextResponse.json({ success: true, data: safe })
  } catch (error: any) {
    console.error('Unexpected staff login error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

