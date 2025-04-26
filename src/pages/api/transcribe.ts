import type { NextApiRequest, NextApiResponse } from 'next';
import { Formidable } from 'formidable';
import fs from 'fs';
import { transcribeAudio } from '@/lib/groq';

// Disable Next.js default body parsing because we're handling files manually
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new Formidable({
    filter: (part) => {
      if (part.mimetype === 'audio/webm;codecs=opus') {
        part.mimetype = 'audio/webm'; // Normalize MIME type
      }
      return true; // Accept all files
    },
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).end();
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).send('No file uploaded');
    }

    // if (file.mimetype === 'audio/webm;codecs=opus') {
    //   file.mimetype = 'audio/webm';
    // }

    // const supportedMimeTypes = [
    //   'audio/flac',
    //   'audio/mp3',
    //   'audio/mp4',
    //   'audio/mpeg',
    //   'audio/mpga',
    //   'audio/m4a',
    //   'audio/ogg',
    //   'audio/opus',
    //   'audio/wav',
    //   'audio/webm',
    // ];
  
    // if (!supportedMimeTypes.includes(file.mimetype ?? '')) {
    //   return res.status(400).json({
    //     error: `Unsupported file type: ${file.mimetype}. Supported types are: ${supportedMimeTypes.join(', ')}`,
    //   });
    // }

    console.log('File details:', {
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      filepath: file.filepath,
    });

    const audioStream = fs.createReadStream(file.filepath);


    try {
      // TODO: Insert speech-to-text logic here
      // const transcript = await speechToText(audioStream);
      // const transcript = audioBuffer.length > 0 ? 'Transcription placeholder' : 'No audio detected';
      const transcript = await transcribeAudio(audioStream);

      res.status(200).json({ transcript });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).send('Failed to transcribe audio');
    }
  });
}
