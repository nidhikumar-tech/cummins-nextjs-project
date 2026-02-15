import { NextResponse } from 'next/server';
import { getOverheadAndUsingElectricData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  try {
    const data = await getOverheadAndUsingElectricData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}