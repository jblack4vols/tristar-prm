import { NextRequest, NextResponse } from 'next/server';
import { DataStorage } from '@/lib/storage';

/**
 * GET /api/data/latest
 * Retrieve the latest processed data
 */
export async function GET(request: NextRequest) {
  try {
    const storedData = await DataStorage.getLatest();
    
    if (!storedData) {
      return NextResponse.json(
        { error: 'No data available' },
        { status: 404 }
      );
    }

    // Check for query parameters to filter or limit results
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const facility = searchParams.get('facility');
    const discipline = searchParams.get('discipline');
    const status = searchParams.get('status');

    let { data } = storedData;

    // Apply filters
    if (facility) {
      data = data.filter(row => 
        row.facility?.toLowerCase().includes(facility.toLowerCase())
      );
    }

    if (discipline) {
      data = data.filter(row => 
        row.discipline?.toLowerCase().includes(discipline.toLowerCase())
      );
    }

    if (status) {
      data = data.filter(row => 
        row.case_status?.toLowerCase().includes(status.toLowerCase())
      );
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        data = data.slice(0, limitNum);
      }
    }

    return NextResponse.json({
      metadata: storedData.metadata,
      data,
      totalRows: data.length,
      filteredRows: data.length !== storedData.data.length ? data.length : undefined
    });

  } catch (error) {
    console.error('Error retrieving latest data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve data' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data/latest
 * Clear the stored data
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check for authentication if secret is configured
    const ingestSecret = process.env.INGEST_SECRET;
    if (ingestSecret) {
      const authHeader = request.headers.get('authorization');
      const providedSecret = authHeader?.replace('Bearer ', '');
      
      if (!providedSecret || providedSecret !== ingestSecret) {
        return NextResponse.json(
          { error: 'Unauthorized. Invalid or missing authentication token.' },
          { status: 401 }
        );
      }
    }

    await DataStorage.clear();
    
    return NextResponse.json({
      message: 'Data cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}
