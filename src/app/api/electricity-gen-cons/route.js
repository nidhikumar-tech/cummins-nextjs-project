import { NextResponse } from 'next/server';
import { getElectricityGenConsData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

//For electric generation & consmption bar chart
export async function GET(request) {
  try {
    const data = await getElectricityGenConsData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}