import {GoogleGenAI, Type} from '@google/genai';

export const gemini = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

<<<<<<< HEAD
export async function generateQuestions(transcript: string, visualContext?: string) {
    const prompt = `You are an assistant creating questions for use in a quiz game in a classroom. Each question is multiple choice, with four possible answers. One of the answers should be correct, the others should be incorrect. The questions should encourage actively working with the information taught in class, not just rote memorization. Do not repeat similar questions.

    You are provided with a portion of the audio transcript of what the instructor said. You are encouraged to synthesize new questions based on all portions of the transcript received, not just the most recent portion. Questions should focus on the content of the transcript, and should not be about the transcript itself. You should not ask questions about the transcript, such as "What did the instructor say?" or "What is the transcript about?". Instead, focus on the content of the transcript and create questions that test understanding of the content.

    You might also be provided with a frame capture from a camera feed or screenshare, presumably of something like presentation slides or a whiteboard that was being referenced during the time the audio took place. This may provide additional context that you may use to create more meaningful questions. Do not reference the image in questions, only use it to derive context to clarify ambiguous statements in the transcript. You should not ask questions about the image, such as "What is shown in the image?" or "What does the image represent?". Instead, focus on the content of the image and create questions that test understanding of the content.

    Here is the transcript: ${transcript}`;
=======
export async function generateQuestions(transcript: string, history: string, visualContext?: string) {
    const systemInstruction = `About you:
    - You are an assistant creating questions for usage in a quiz game in a classroom.
    - Each question is multiple choice, with four possible answers. 
    - The questions you provide should encourage actively working with the information taught in class, not just rote memorization.

    Your resources:
    - You are provided with a portion of the audio transcript of what the instructor said.
    - You are encouraged to synthesize new questions based on all portions of the transcript received, not just the most recent portion.
    - You are provided with a frame capture from a camera feed or screenshare during the time the audio took place. This may provide additional context that you may use to create more meaningful questions.
    - You are provided with a list of questions that you have already generated. You should not repeat these questions. 
    
    Your requirements:
    - For each question you generate, one of the answers should be correct and the others should be incorrect.
    - You should not rely on visual context alone to create questions. You should always use the transcript as the primary source of information for generating questions.
    - You should avoid generating questions that are too similar to ones that have already been asked.
    - You should also be aware of the questions that have already been generated and avoid repeating them.
    - You should never mention 'the transcript' or 'the visual context' in the questions you generate. They should be phrased in a way that is natural and engaging for the user.
    - You should not mention 'the speaker' or 'the instructor' in the questions you generate. The questions should be phrased in a way that is neutral and does not imply any specific speaker.
    - You should always provide a time limit for each question, which should be between 10 and 30 seconds.
    `;

    const prompt = `Generate a set of questions based on the following information subject to your requirements:

    Questions that you have already generated:
    ${history}

    Transcript with timestamps:
    ${transcript}
    `;
>>>>>>> 0a7aa60 (add history of questions asked as knowledge for ai and edit prompt)

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
            systemInstruction: systemInstruction,
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
