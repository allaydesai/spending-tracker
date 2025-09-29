import { NextRequest, NextResponse } from 'next/server';
import { ImportService } from '@/lib/services/import-service';
import { validateImportOptions } from '@/lib/models/import-result';
import { DATABASE_CONFIG } from '@/lib/db/config';

export async function POST(request: NextRequest) {
  try {
    // Initialize database if needed
    const { initializeDatabase } = await import('@/lib/db/init');
    await initializeDatabase();

    const importService = new ImportService();

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const optionsStr = formData.get('options') as string | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided. Please select a CSV file to upload.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > DATABASE_CONFIG.MAX_CSV_SIZE) {
      const maxSizeMB = DATABASE_CONFIG.MAX_CSV_SIZE / (1024 * 1024);
      return NextResponse.json(
        { message: `File size exceeds maximum allowed size of ${maxSizeMB}MB.` },
        { status: 413 }
      );
    }

    // Validate file is not empty
    if (file.size === 0) {
      return NextResponse.json(
        { message: 'File is empty. Please upload a file with transaction data.' },
        { status: 400 }
      );
    }

    // Parse and validate options
    let options = { skipDuplicates: true, validateOnly: false };
    if (optionsStr) {
      try {
        const parsedOptions = JSON.parse(optionsStr);
        const validatedOptions = validateImportOptions(parsedOptions);
        options = {
          skipDuplicates: validatedOptions.skipDuplicates ?? true,
          validateOnly: validatedOptions.validateOnly ?? false
        };
      } catch (error: any) {
        return NextResponse.json(
          { message: `Invalid options format: ${error.message}` },
          { status: 400 }
        );
      }
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Import the CSV
    const result = await importService.importFromCSV(fileBuffer, file.name, options);

    // Return success response
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Import API error:', error);

    // Handle specific error types
    if (error.message.includes('Invalid CSV format')) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('File size exceeds')) {
      return NextResponse.json(
        { message: error.message },
        { status: 413 }
      );
    }

    if (error.message.includes('Database')) {
      return NextResponse.json(
        { message: 'Database error occurred. Please try again later.' },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { message: 'An error occurred while importing the file. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}