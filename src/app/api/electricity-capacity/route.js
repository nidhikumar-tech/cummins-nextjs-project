import { NextResponse } from 'next/server';
import { getElectricityCapacityData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

//For electric capacity bar chart
export async function GET(request) {
  try {
    const rows = await getElectricityCapacityData();
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}