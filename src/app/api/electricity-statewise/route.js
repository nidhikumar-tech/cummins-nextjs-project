import { NextResponse } from 'next/server';
// Adjust the relative path to your bigquery.js file if necessary
import { getCumminsElectricityStatewiseData } from '@/lib/bigquery';

export async function GET() {
  try {
    const data = await getCumminsElectricityStatewiseData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(`Error in electricity-statewise API:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}