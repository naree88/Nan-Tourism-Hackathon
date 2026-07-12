"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, ShieldCheck, Sparkles } from "lucide-react";

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
  }>;
};

type SpeechRecognitionErrorLike = { error: string };

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => RecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

type VoiceState = "idle" | "listening" | "denied" | "unavailable" | "error";

export type VoiceTranscriptSource = "voice" | "demo";

type VoiceInputProps = {
  value: string;
  onChange: (value: string) => void;
  onTranscript?: (source: VoiceTranscriptSource, transcript: string) => void;
  demoTranscript: string;
  label?: string;
};

function appendTranscript(value: string, transcript: string): string {
  const addition = transcript.trim();
  if (!addition) return value;
  if (!value) return addition;
  return `${value}${/\s$/u.test(value) ? "" : " "}${addition}`;
}

export function VoiceInput({
  value,
  onChange,
  onTranscript,
  demoTranscript,
  label = "พูดภาษาไทย",
}: VoiceInputProps) {
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const latestValueRef = useRef(value);
  const processedResultIndexesRef = useRef(new Set<number>());
  const [state, setState] = useState<VoiceState>("idle");
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    const checkSupport = window.setTimeout(() => {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setSupported(Boolean(Recognition));
      if (!Recognition) setState("unavailable");
    }, 0);

    return () => {
      window.clearTimeout(checkSupport);
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
      }
    };
  }, []);

  function insertTranscript(transcript: string, source: VoiceTranscriptSource) {
    const normalizedTranscript = transcript.trim();
    if (!normalizedTranscript) return;

    const nextValue = appendTranscript(latestValueRef.current, normalizedTranscript);
    latestValueRef.current = nextValue;
    onChange(nextValue);
    onTranscript?.(source, normalizedTranscript);
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      setState("unavailable");
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    processedResultIndexesRef.current = new Set<number>();
    recognition.lang = "th-TH";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const finalSegments = Array.from(event.results)
        .flatMap((result, index) => {
          if (!result.isFinal || processedResultIndexesRef.current.has(index)) return [];
          processedResultIndexesRef.current.add(index);
          const transcript = result[0]?.transcript?.trim();
          return transcript ? [transcript] : [];
        });
      const transcript = finalSegments
        .join(" ")
        .trim();
      if (transcript) insertTranscript(transcript, "voice");
    };
    recognition.onerror = (event) => {
      setState(event.error === "not-allowed" ? "denied" : "error");
    };
    recognition.onend = () => {
      setState((current) => (current === "listening" ? "idle" : current));
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setState("listening");
    } catch {
      setState("error");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setState("idle");
  }

  const message = {
    idle: "เสียงจะใช้เพื่อถอดคำครั้งนี้เท่านั้น และแอปไม่เก็บไฟล์เสียง",
    listening: "กำลังฟัง… พูดได้เลย แล้วกดหยุดเมื่อเสร็จ",
    denied: "เบราว์เซอร์ไม่อนุญาตไมโครโฟน คุณยังพิมพ์หรือใช้ประโยคเดโมได้",
    unavailable: "เบราว์เซอร์นี้ยังไม่รองรับการถอดเสียง ใช้ประโยคเดโมหรือพิมพ์แทนได้",
    error: "ถอดเสียงไม่สำเร็จ ข้อความเดิมยังอยู่ ลองใหม่หรือใช้ประโยคเดโมได้",
  }[state];

  return (
    <div className="voice-row">
      <button
        className={`voice-button${state === "listening" ? " is-listening" : ""}`}
        type="button"
        onClick={state === "listening" ? stopListening : startListening}
        aria-pressed={state === "listening"}
      >
        {state === "listening" ? <MicOff size={19} aria-hidden="true" /> : <Mic size={19} aria-hidden="true" />}
        {state === "listening" ? "หยุดฟัง" : label}
      </button>
      <p className="privacy-note" aria-live="polite">
        <ShieldCheck size={13} aria-hidden="true" /> {message}
      </p>
      {(supported === false || state === "denied" || state === "error") && (
        <div className="demo-transcript">
          <span className="privacy-note">ตัวอย่างคำพูดสำหรับทดสอบโดยไม่ใช้ไมโครโฟน</span>
          <button type="button" onClick={() => insertTranscript(demoTranscript, "demo")}>
            <Sparkles size={14} aria-hidden="true" /> “{demoTranscript}”
          </button>
        </div>
      )}
      {supported !== false && state === "idle" && !value && (
        <button className="button button--ghost" type="button" onClick={() => insertTranscript(demoTranscript, "demo")}>
          <Sparkles size={15} aria-hidden="true" />
          ใช้ประโยคเดโม
        </button>
      )}
    </div>
  );
}
