import { NextResponse } from 'next/server';
import { getCumulativeEmissionData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request) {
  try {
    const rows = await getCumulativeEmissionData();
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching cumulative emission data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
