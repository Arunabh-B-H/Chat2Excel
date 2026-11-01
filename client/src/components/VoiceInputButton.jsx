import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Mic, MicOff, X, ShieldAlert } from 'lucide-react';

const VoiceInputButton = forwardRef(function VoiceInputButton({ 
  onTranscript, 
  currentText = '', 
  onRecordingChange 
}, ref) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const basePrefixRef = useRef('');

  useEffect(() => {
    // Check initial microphone permission if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then((permissionStatus) => {
          setPermissionState(permissionStatus.state);
          permissionStatus.onchange = () => setPermissionState(permissionStatus.state);
        })
        .catch(() => {});
    }

    return () => {
      stopAllRecording();
    };
  }, []);

  const updateRecordingState = (recording) => {
    setIsRecording(recording);
    if (onRecordingChange) {
      onRecordingChange(recording);
    }
  };

  const stopAllRecording = () => {
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
      } catch (e) {}
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }
    updateRecordingState(false);
  };

  useImperativeHandle(ref, () => ({
    stopRecording: () => {
      stopAllRecording();
    },
    isRecording: () => isRecording
  }), [isRecording]);

  const handleMicClick = async () => {
    setErrorMessage('');

    // If currently recording, stop it immediately
    if (isRecording) {
      stopAllRecording();
      return;
    }

    // Step 1: Check Browser Speech Recognition Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      setShowPermissionModal(true);
      return;
    }

    // Step 2: First-time Permission Request via getUserMedia
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setPermissionState('granted');
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      setPermissionState('denied');
      setErrorMessage('Microphone access is blocked. Please click the lock or settings icon in your browser address bar and allow Microphone permissions to use voice typing.');
      setShowPermissionModal(true);
      return;
    }

    // Step 3: Setup Continuous Session Base Prefix
    // Snapshot the current text so newly spoken words seamlessly append without wiping prior text
    const trimmed = (currentText || '').trim();
    basePrefixRef.current = trimmed ? `${trimmed} ` : '';

    // Step 4: Start Speech Recognition Engine
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // Tuned for high-accuracy Indian English & regional entity clarity, falling back gracefully
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        updateRecordingState(true);
      };

      recognition.onresult = (event) => {
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            sessionFinal += `${item[0].transcript} `;
          } else {
            sessionInterim += item[0].transcript;
          }
        }

        // Clean & Format words: combine base prefix + session finalized words + live interim
        const combined = `${basePrefixRef.current}${sessionFinal}${sessionInterim}`
          .replace(/\s+/g, ' ')
          .trim();

        onTranscript(combined);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setPermissionState('denied');
          setErrorMessage('Microphone permission was denied by the browser.');
          setShowPermissionModal(true);
        } else if (event.error === 'no-speech') {
          // Normal timeout if user was quiet, keep stream alive
          return;
        } else {
          setErrorMessage(`Speech error: ${event.error}`);
        }
        stopAllRecording();
      };

      recognition.onend = () => {
        if (mediaStreamRef.current) {
          try {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          } catch (e) {}
          mediaStreamRef.current = null;
        }
        updateRecordingState(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      stopAllRecording();
    }
  };

  return (
    <>
      {/* Microphone Button with Animated Soundwave Equalizer */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleMicClick}
          title={isRecording ? 'Click to Stop Recording' : 'Speak Instructions via Voice'}
          className={`relative p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            isRecording
              ? 'bg-red-50 text-red-600 ring-2 ring-red-500/30 shadow-md shadow-red-500/10'
              : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
          }`}
        >
          {isRecording ? (
            <>
              {/* Animated Live Equalizer Waves */}
              <div className="flex items-center gap-0.5 px-0.5">
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-2.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.4s]" />
                <span className="w-1 h-3.5 bg-red-500 rounded-full animate-bounce" />
              </div>
              <span className="text-[11px] font-bold font-mono text-red-600 pr-0.5">Listening...</span>
              <MicOff size={15} className="text-red-600" />
            </>
          ) : (
            <Mic size={17} />
          )}
        </button>
      </div>

      {/* Permission Guide Modal (Triggered on First-Time Block) */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-800">
            <button
              onClick={() => setShowPermissionModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              title="Close Dialog"
            >
              <X size={16} />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Enable Microphone Access</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {errorMessage || 'To dictate accounting instructions by voice, please allow microphone permissions in your browser.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] font-mono text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">How to fix in 10 seconds:</p>
              <p>1. Click the lock/settings icon next to the URL in your browser address bar.</p>
              <p>2. Set <strong>Microphone</strong> to <strong>Allow</strong>.</p>
              <p>3. Refresh the page and click the mic icon again.</p>
            </div>

            <button
              onClick={() => setShowPermissionModal(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default VoiceInputButton;
