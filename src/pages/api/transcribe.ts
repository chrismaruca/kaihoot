import type { NextApiRequest, NextApiResponse } from 'next';
import Busboy from 'busboy';
import fs from 'fs';
import path from 'path';
import { transcribeAudio } from '@/lib/groq';

// Disable Next.js default body parsing because we're handling files manually
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const busboy = Busboy({ headers: req.headers });
  const uploads: Promise<string>[] = [];

  // @ts-ignore
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    console.log(filename.filename)
    const saveTo = path.join('/tmp', filename.filename);
    const writeStream = fs.createWriteStream(saveTo);

    file.pipe(writeStream);

    uploads.push(
      new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(saveTo));
        writeStream.on('error', reject);
      })
    );
  });

  busboy.on('finish', async () => {
    try {
      const filePaths = await Promise.all(uploads);

      if (filePaths.length === 0) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = filePaths[0];
      const audioStream = fs.createReadStream(filePath);

      const transcript = await transcribeAudio(audioStream);

      // Clean up the temporary file
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete temporary file:', err);
      });

      res.status(200).json({ transcript });
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ error: 'Failed to process file' });
    }
  });

  req.pipe(busboy);
}
