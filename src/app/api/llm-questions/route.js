import { NextResponse } from 'next/server';
import { getLLMQuestions } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fuelType = searchParams.get('fuelType') || null;

    const rows = await getLLMQuestions(fuelType);

    const formattedData = rows.map((row, idx) => ({
      rowNumber: idx,
      question: row.question || '',
      answer: row.answer || '',
      fuelType: row.fuel_type || '',
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
    });
  } catch (error) {
    console.error('LLM Questions API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch questions',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
