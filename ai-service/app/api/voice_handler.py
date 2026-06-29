import os
from typing import Dict, Any

# Try importing speech libraries, fallback gracefully if not installed
try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

class VoiceEngine:
    def __init__(self):
        self.model_size = "base"
        self.whisper_model = None
        
    def init_whisper(self):
        """
        Delayed initialization of whisper model to save memory footprint.
        """
        if WHISPER_AVAILABLE and self.whisper_model is None:
            try:
                # Runs on CPU by default with float32 or int8 quantization
                self.whisper_model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
                print(f"[INFO] Whisper model '{self.model_size}' loaded successfully on CPU.")
            except Exception as e:
                print(f"[WARN] Failed to load WhisperModel: {str(e)}")
                self.whisper_model = None

    def transcribe_audio(self, audio_file_path: str) -> str:
        """
        Transcribes raw audio wave buffer into English text.
        """
        if not os.path.exists(audio_file_path):
            return "Error: Audio buffer file not found."
            
        self.init_whisper()
        
        if WHISPER_AVAILABLE and self.whisper_model is not None:
            try:
                segments, info = self.whisper_model.transcribe(audio_file_path, beam_size=5)
                transcription = " ".join([segment.text for segment in segments])
                return transcription.strip()
            except Exception as e:
                print(f"[ERROR] Whisper transcription failed: {str(e)}")
                return "Error: Whisper transcription pipeline execution failed."
        else:
            # Phase 7 Fallback: Standard browser-native SpeechRecognition fallback message
            print("[INFO] Whisper not available. Invoking Web Speech API fallback handler.")
            return "Error: Whisper offline. Falling back to client-side Web Speech transcription."

    async def synthesize_speech(self, text: str, output_path: str, voice: str = "en-US-EmmaMultilingualNeural") -> bool:
        """
        Converts pediatric text guidelines into clear MP3 audio files.
        """
        # Clean text from markdown characters for speech clarity
        clean_text = text.replace("**", "").replace("*", "").replace("###", "").replace("-", "")
        
        if EDGE_TTS_AVAILABLE:
            try:
                communicate = edge_tts.Communicate(clean_text, voice)
                await communicate.save(output_path)
                return True
            except Exception as e:
                print(f"[ERROR] Edge-TTS synthesis failed: {str(e)}")
                return False
        else:
            print("[INFO] Edge-TTS offline. Relying on client-side SpeechSynthesis fallback.")
            return False

# Singleton instance
_voice_engine_instance = None

def get_voice_engine():
    global _voice_engine_instance
    if _voice_engine_instance is None:
        _voice_engine_instance = VoiceEngine()
    return _voice_engine_instance
