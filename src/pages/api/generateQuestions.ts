import type { NextApiRequest, NextApiResponse } from 'next';
// import { generateQuestionsFromTranscript } from '@/utils/questionGenerator'; // Utility function for generating questions
import { db } from '@/lib/firebaseAdmin'; // Import Firebase Admin database
import { generateQuestions } from '@/lib/gemini';
import { HostQuestion, TranscriptStep } from '@/types/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { gameId } = req.body;

    try {
        // Fetch the transcript from Firebase
        const transcriptRef = db.ref(`games/${gameId}/transcripts`);
        const snapshot = await transcriptRef.get();

        if (!snapshot.exists()) {
          return res.status(404).json({ error: 'Transcript not found for the given gameId' });
        }

        // Assuming the transcript is stored as the latest entry in the transcripts node
        const transcripts: TranscriptStep[] = snapshot.val();
        if (!transcripts || Object.keys(transcripts).length === 0) {
          return res.status(404).json({ error: 'No transcripts found for the given gameId' });
        }

        // Extract transcript text and visual context (if available)
        let visualContext: string | undefined;
        const transcript = Object.values(transcripts).reduce((total: string, current: TranscriptStep) => {
          // Check if this step has visualContext and store it
          if (current.visualContext && !visualContext) {
            visualContext = current.visualContext;
          }
          return total + `\n${current.timestamp}: ${current.transcript}`;
        }, '');


        // Fetch the history of questions asked from Firebase
        const historyRef = db.ref(`games/${gameId}/questions`);
        const historySnapshot = await historyRef.get();

        let history: string = '';
        if (historySnapshot.exists()) {
          const previousQuestions = historySnapshot.val();
          history = previousQuestions.map((question: HostQuestion) => question.text).reduce((total: string, current: string) => {
            return total + `\n${current}`;
          }, '');
        }

        // Generate questions from the transcript, passing the visualContext and history if available
        const response = await generateQuestions(transcript, history, visualContext);

        if (!response || !response.text) {
          return res.status(500).json({ error: 'Failed to generate questions' });
        }

        // console.log('Response from Gemini:', response.text);

        // const questionString = response.text.replace("```json", "").replace("```", "");


        // console.log('Response from Gemini:', questionString);

        let questions: HostQuestion[] = [];
        try {
          // Parse the response text to JSON
          const parsedResponse = JSON.parse(response.text);
          questions = parsedResponse.map((question: any) => ({
            text: question.text,
            options: question.options,
            correctAnswer: question.correctAnswer,
            timeLimit: question.timeLimit,
            difficulty: question.difficulty,
          }));
        } catch (error) {
          console.error('Error parsing response:', error);
          return res.status(500).json({ error: 'Failed to generate questions' });
        }
        console.log('Generated Questions:', questions);

        // Push the questions to Firebase
        const questionsRef = db.ref(`games/${gameId}/questions`);
        const existingQuestionsSnapshot = await questionsRef.get();
        let existingQuestions: HostQuestion[] = [];

        if (existingQuestionsSnapshot.exists()) {
          existingQuestions = existingQuestionsSnapshot.val();
        }

        const updatedQuestions = [...existingQuestions, ...questions];
        await questionsRef.set(updatedQuestions);

        res.status(200).json({ questions: questions });
      } catch (error) {
        console.error('Error generating questions:', error);
        res.status(500).json({ error: 'Failed to generate questions' });
      }
}
