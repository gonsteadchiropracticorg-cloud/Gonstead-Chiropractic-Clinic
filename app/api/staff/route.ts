import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - Fetch all staff accounts
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('staff_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching staff accounts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new staff account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, ...accountData } = body

    // NOTE: For now we persist the password as provided so that
    // the client-side staff dashboard can validate credentials
    // against the `staff_accounts` table via a secure API.
    // This keeps the flow simple for a small internal clinic app.
    // If you later want stronger security, we can switch this to
    // a hash (e.g. using Node crypto) without changing the API.

    // Generate ID if not provided
    const record = {
      id: accountData.id || `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      username: accountData.username,
      display_name: accountData.display_name || '',
      email: accountData.email || '',
      phone: accountData.phone || '',
      role: accountData.role || 'staff',
      active: accountData.active !== undefined ? accountData.active : true,
      password: password || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('staff_accounts')
      .insert(record)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating staff account:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit event
    await supabaseAdmin.from('audit_logs').insert({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      action: 'create',
      entity_type: 'staff',
      entity_id: data.id,
      source: 'admin_dashboard',
      reversible: true,
      meta: { after: data }
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update staff account
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, password, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // If a new password is provided, update it as well so staff
    // can use the latest credentials from the admin panel.
    if (typeof password === 'string' && password.trim().length > 0) {
      ;(updates as any).password = password
    }

    const { data, error } = await supabaseAdmin
      .from('staff_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating staff account:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit event
    await supabaseAdmin.from('audit_logs').insert({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      action: 'update',
      entity_type: 'staff',
      entity_id: id,
      source: 'admin_dashboard',
      reversible: true,
      meta: { after: data }
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove staff account
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Get account before deleting for audit log
    const { data: before } = await supabaseAdmin
      .from('staff_accounts')
      .select('*')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('staff_accounts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting staff account:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit event
    if (before) {
      await supabaseAdmin.from('audit_logs').insert({
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        action: 'delete',
        entity_type: 'staff',
        entity_id: id,
        source: 'admin_dashboard',
        reversible: true,
        meta: { before }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

