import { NextResponse } from 'next/server';
import { getCNGProductionPlants } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  try {
    const data = await getCNGProductionPlants();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch CNG plants' }, { status: 500 });
  }
}