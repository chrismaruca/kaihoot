import Groq from "groq-sdk";
import { FsReadStream } from "groq-sdk/_shims/node-types.mjs";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeAudio(audioStream: FsReadStream) {
    console.log(audioStream);
    
    try {
        const response = await groq.audio.transcriptions.create({
        file: audioStream,
        model: "distil-whisper-large-v3-en",
        response_format: "verbose_json",
        });
        return response;
    } catch (error) {
        console.error("Transcription error:", error);
        throw new Error("Failed to transcribe audio");
    }
}