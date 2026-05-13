import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { scrubMetadata } from '@/lib/scrubber';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Privacy: Scrub metadata before saving
    const scrubbedBuffer = await scrubMetadata(buffer, file.type);

    const fileId = randomUUID();
    const extension = path.extname(file.name) || '.bin';
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    await fs.promises.writeFile(filePath, scrubbedBuffer);

    // Return the URL (using public folder for now)
    const url = `/uploads/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url, 
      fileId,
      message: 'Metadata scrubbed and file secured.'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload and scrub media' }, { status: 500 });
  }
}
