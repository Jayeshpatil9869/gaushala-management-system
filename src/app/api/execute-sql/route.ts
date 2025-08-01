import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Add dynamic export to fix static export error
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { sql } = await request.json()
    
    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 })
    }
    
    // Execute SQL using RPC function
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sql
    })
    
    if (error) {
      console.error('SQL execution error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Execute SQL error:', error)
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}

// Create the SQL function in Supabase:
/*
-- Function to execute SQL queries
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query;
  result := '{"success": true}'::JSONB;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/ 