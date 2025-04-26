import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

// Disable Next.js default body parsing because we're handling files manually
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).end();
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).send('No file uploaded');
    }

    const audioBuffer = fs.readFileSync(file.filepath);

    try {
      // TODO: Insert speech-to-text logic here
      const transcript = await speechToText(audioBuffer);

      res.status(200).json({ transcript });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).send('Failed to transcribe audio');
    }
  });
}
