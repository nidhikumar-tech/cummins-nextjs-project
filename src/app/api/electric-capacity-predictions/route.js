// src/app/api/electric-capacity-predictions/route.js
import { NextResponse } from 'next/server';
import { getElectricCapacityPredictions } from '@/lib/bigquery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'CA';

    const data = await getElectricCapacityPredictions(state);
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch electric prediction data' },
      { status: 500 }
    );
  }
}