import type { NextApiRequest, NextApiResponse } from 'next';
import Busboy from 'busboy';
import fs from 'fs';
import path from 'path';
import { transcribeAudio } from '@/lib/groq';
import { db } from '@/lib/firebaseAdmin'; // Import Firebase Admin database

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
  let gameId: string | null = null;
  let visualContext: string | null = null;

  busboy.on("field", (fieldname, value) => {
    if (fieldname === "gameId") {
      gameId = value;
    } else if (fieldname === "visualContext") {
      visualContext = value;
    }
  });

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

      if (!gameId || gameId === 'undefined') {
        return res.status(400).json({ error: "Missing gameId" });
      }

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

      // Push the transcript to Firebase
      const timestamp = Date.now();
      const transcriptRef = db.ref(`games/${gameId}/transcripts/${timestamp}`);
      await transcriptRef.set({
        transcript: transcript.text,
        timestamp,
        visualContext: visualContext || null, // Store the visual context if available
      });

      res.status(200).json({ transcript: transcript.text });
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ error: 'Failed to process file' });
    }
  });

  req.pipe(busboy);
}
