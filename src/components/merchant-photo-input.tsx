"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AcceptedPhotoType = (typeof ACCEPTED_PHOTO_TYPES)[number];

export type MerchantPhotoValue = {
  fileName: string;
  mimeType: AcceptedPhotoType;
  sizeBytes: number;
  dataUrl: string;
};

export type MerchantPhotoInputProps = {
  value: MerchantPhotoValue | null;
  onChange: (value: MerchantPhotoValue | null) => void;
  disabled?: boolean;
  label?: string;
};

function isAcceptedPhotoType(type: string): type is AcceptedPhotoType {
  return ACCEPTED_PHOTO_TYPES.some((acceptedType) => acceptedType === type);
}

function formatFileSize(sizeBytes: number): string {
  return `${(sizeBytes / 1024 / 1024).toLocaleString("th-TH", {
    maximumFractionDigits: 1,
  })} MB`;
}

export function MerchantPhotoInput({
  value,
  onChange,
  disabled = false,
  label = "เพิ่มรูปถ่าย",
}: MerchantPhotoInputProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<FileReader | null>(null);
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    return () => {
      const reader = readerRef.current;
      readerRef.current = null;
      reader?.abort();
    };
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setError("");

    if (!file) return;

    if (!isAcceptedPhotoType(file.type)) {
      setError("รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP เท่านั้น");
      return;
    }
    const mimeType = file.type;

    if (file.size > MAX_PHOTO_BYTES) {
      setError("รูปมีขนาดเกิน 2 MB กรุณาเลือกรูปที่มีขนาดเล็กลง");
      return;
    }

    readerRef.current?.abort();
    const reader = new FileReader();
    readerRef.current = reader;
    setIsReading(true);

    reader.onload = () => {
      if (readerRef.current !== reader) return;

      if (typeof reader.result !== "string") {
        setError("อ่านรูปไม่สำเร็จ กรุณาลองเลือกรูปอีกครั้ง");
        setIsReading(false);
        return;
      }

      onChange({
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
        dataUrl: reader.result,
      });
      setIsReading(false);
      readerRef.current = null;
    };

    reader.onerror = () => {
      if (readerRef.current !== reader) return;
      setError("อ่านรูปไม่สำเร็จ กรุณาลองเลือกรูปอีกครั้ง");
      setIsReading(false);
      readerRef.current = null;
    };

    reader.onabort = () => {
      if (readerRef.current !== reader) return;
      setIsReading(false);
      readerRef.current = null;
    };

    reader.readAsDataURL(file);
  }

  function removePhoto() {
    const reader = readerRef.current;
    readerRef.current = null;
    reader?.abort();
    if (inputRef.current) inputRef.current.value = "";
    setIsReading(false);
    setError("");
    onChange(null);
  }

  return (
    <div className="merchant-photo-input" aria-busy={isReading}>
      <label className="merchant-photo-input__label" htmlFor={inputId}>
        <ImagePlus size={18} aria-hidden="true" />
        {value ? "เปลี่ยนรูปถ่าย" : label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className="merchant-photo-input__control"
        type="file"
        accept={ACCEPTED_PHOTO_TYPES.join(",")}
        onChange={handleFileChange}
        aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
        aria-invalid={Boolean(error)}
        disabled={disabled || isReading}
      />
      <p className="merchant-photo-input__hint" id={hintId}>
        รูปเมนู ฉลากถุงกาแฟ หรือผลทดสอบอินเทอร์เน็ต · JPEG, PNG หรือ WebP ไม่เกิน 2 MB
      </p>

      {isReading ? (
        <p className="merchant-photo-input__status" role="status">
          <LoaderCircle size={16} aria-hidden="true" />
          กำลังเตรียมรูป…
        </p>
      ) : null}

      {error ? (
        <p className="merchant-photo-input__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}

      {value ? (
        <figure className="merchant-photo-input__preview">
          <Image
            src={value.dataUrl}
            width={640}
            height={420}
            sizes="(max-width: 640px) 100vw, 640px"
            unoptimized
            alt={`รูปที่แนบ: ${value.fileName}`}
          />
          <figcaption>
            <span>
              <strong>{value.fileName}</strong>
              <small>{formatFileSize(value.sizeBytes)}</small>
            </span>
            <button
              className="merchant-photo-input__remove"
              type="button"
              onClick={removePhoto}
              disabled={disabled}
              aria-label={`นำรูป ${value.fileName} ออก`}
            >
              <Trash2 size={16} aria-hidden="true" />
              นำรูปออก
            </button>
          </figcaption>
        </figure>
      ) : null}
    </div>
  );
}
