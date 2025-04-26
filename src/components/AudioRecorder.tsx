import { useEffect, useState } from 'react';

export default function AudioRecorder() {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    async function setupRecorder() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          const audioBlob = e.data;
          await uploadAudioBlob(audioBlob);
        }
      };

      setMediaRecorder(recorder);
    }

    setupRecorder();
  }, []);

  const startRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.start(15 * 1000); // Emit 15s blobs
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setIsRecording(false);
  };

  const uploadAudioBlob = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob);

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    console.log('Transcribed Text:', data.transcript);
  };

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop recording
      </button>
    </div>
  );
}