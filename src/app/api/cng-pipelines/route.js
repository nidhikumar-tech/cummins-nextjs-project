import { NextResponse } from 'next/server';
import { getCNGPipelinesData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Cache for 24 hours (pipelines rarely move)

export async function GET() {
  try {
    const rows = await getCNGPipelinesData();
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}