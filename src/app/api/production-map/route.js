import { NextResponse } from 'next/server';
import { getStatewiseProductionData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'cng'; // 'cng' or 'electric'

  try {
    const rows = await getStatewiseProductionData(type);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}