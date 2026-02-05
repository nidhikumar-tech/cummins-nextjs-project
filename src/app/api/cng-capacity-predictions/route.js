import { NextResponse } from 'next/server';
import { getCNGCapacityPredictions } from '@/lib/bigquery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'CA';

    const data = await getCNGCapacityPredictions(state);
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CNG prediction data' },
      { status: 500 }
    );
  }
}