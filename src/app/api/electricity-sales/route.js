import { NextResponse } from 'next/server';
import { getCumminsElectricitySales } from '@/lib/bigquery';

export async function GET() {
  try {
    const data = await getCumminsElectricitySales();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(`Error in electricity-sales-cummins API:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}