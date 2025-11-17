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
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('staff_accounts')
      .select('*')
      .eq('username', username)
      .eq('active', true)
      .maybeSingle()

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

    if (!data.password || data.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
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

