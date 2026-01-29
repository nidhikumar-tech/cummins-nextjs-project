import { NextResponse } from 'next/server';
import { getStatewiseEmissionData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  try {
    const rows = await getStatewiseEmissionData(state);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching statewise emission data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
