import {GoogleGenAI, Type} from '@google/genai';

export const gemini = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

export async function generateQuestions(transcript: string, visualContext?: string) {
    const prompt = `You are an assistant creating questions for usage in a quiz game in a classroom. Each question is multiple choice, with four possible answers. One of the answers should be correct, the others should be incorrect. The questions should encourage actively working with the information taught in class, not just rote memorization. Do not repeat similar questions.

    You are provided with a portion of the audio transcript of what the instructor said. You are encouraged to synthesize new questions based on all portions of the transcript received, not just the most recent portion.

    You might also be provided with a frame capture from a camera feed or screenshare, presumably of something like presentation slides or a whiteboard that was being referenced during the time the audio took place. This may provide additional context that you may use to create more meaningful questions.

    Here is the transcript with timestamps: ${transcript}`;

    // Create contents array for the request
    const contents = [];

    // Add visual context first if provided
    if (visualContext) {
        // Remove the "data:image/jpeg;base64," prefix if it exists
        let imageData = visualContext;
        if (imageData.startsWith('data:image/jpeg;base64,')) {
            imageData = imageData.substring('data:image/jpeg;base64,'.length);
        }

        contents.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageData
            }
        });
    }

    // Add text prompt
    contents.push({ text: prompt });

    const response = await gemini.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: contents,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        options: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            minItems: '4',
                            maxItems: '4',
                        },
                        correctAnswer: { type: Type.STRING },
                        timeLimit: { type: Type.NUMBER },
                        difficulty: {
                            type: Type.STRING,
                            enum: ['easy', 'medium', 'hard'],
                            default: 'medium',
                        }
                    },
                    required: ['text', 'options', 'correctAnswer', 'timeLimit', 'difficulty'],
                },
                minItems: '4',
                maxItems: '4',
            }
        },
   });

   return response;
}
