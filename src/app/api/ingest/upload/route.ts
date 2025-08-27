import { NextRequest, NextResponse } from 'next/server';
import { normalizeWorkbook } from '@/lib/normalize';
import { DataStorage } from '@/lib/storage';
import { validateRequiredColumns } from '@/lib/columns';

/**
 * POST /api/ingest/upload
 * Handle Excel file upload and normalization
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    // Also check file extension as fallback for files with missing/incorrect MIME types
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      return NextResponse.json(
        { error: `Invalid file type. File type: "${file.type}", Extension: "${fileExtension}". Please upload an Excel file (.xlsx, .xls) or CSV file.` },
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Normalize the workbook data
    let normalizedData;
    try {
      normalizedData = normalizeWorkbook(arrayBuffer);
    } catch (normalizationError) {
      console.error('Normalization error:', normalizationError);
      return NextResponse.json(
        { error: 'Failed to process the Excel file. Please check the file format and try again.' },
        { status: 400 }
      );
    }

    // Validate that we have data
    if (!normalizedData || normalizedData.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in the uploaded file' },
        { status: 400 }
      );
    }

    // Store the normalized data
    await DataStorage.store(normalizedData, file.name);

    // Return success response with summary
    return NextResponse.json({
      message: 'File uploaded and processed successfully',
      summary: {
        filename: file.name,
        totalRows: normalizedData.length,
        processedAt: new Date().toISOString(),
        sampleData: normalizedData.slice(0, 3) // First 3 rows for preview
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during file processing' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ingest/upload
 * Get upload status and requirements
 */
export async function GET() {
  try {
    const stats = await DataStorage.getStats();
    
    return NextResponse.json({
      uploadInfo: {
        acceptedFormats: ['.xlsx', '.xls', '.csv'],
        maxFileSize: '10MB',
        requiredColumns: ['created_date', 'referring_doctor'],
        optionalColumns: [
          'referring_doctor_npi',
          'facility',
          'primary_insurance',
          'discipline',
          'therapist',
          'arrived_visits',
          'scheduled_visits',
          'initial_eval_date',
          'first_scheduled_date',
          'first_arrived_date',
          'discharge_date',
          'case_status'
        ]
      },
      currentData: {
        hasData: await DataStorage.hasData(),
        totalRows: stats.totalRows,
        lastUpdated: stats.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error getting upload info:', error);
    return NextResponse.json(
      { error: 'Failed to get upload information' },
      { status: 500 }
    );
  }
}
