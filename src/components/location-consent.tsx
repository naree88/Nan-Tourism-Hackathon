"use client";

import { useState } from "react";
import { ArrowRight, LocateFixed, MapPin, ShieldCheck } from "lucide-react";

type LocationState = "idle" | "requesting" | "granted" | "denied" | "unavailable" | "timeout";

export type ConsentedLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};

type LocationConsentProps = {
  onLocation: (location: ConsentedLocation | null) => void;
  variant?: "default" | "entry-card";
  initialLocation?: ConsentedLocation | null;
};

export function LocationConsent({
  onLocation,
  variant = "default",
  initialLocation = null,
}: LocationConsentProps) {
  const [state, setState] = useState<LocationState>(initialLocation ? "granted" : "idle");

  function requestLocation() {
    if (initialLocation) {
      onLocation(initialLocation);
      return;
    }

    if (!navigator.geolocation) {
      setState("unavailable");
      onLocation(null);
      return;
    }

    setState("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: Math.round(position.coords.accuracy),
        };
        onLocation(location);
        setState("granted");
      },
      (error) => {
        setState(error.code === error.PERMISSION_DENIED ? "denied" : error.code === error.TIMEOUT ? "timeout" : "unavailable");
        onLocation(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  }

  const help = {
    idle: "ตำแหน่งจะถูกขอเมื่อคุณกดปุ่ม และใช้กับการค้นหาครั้งนี้เท่านั้น",
    requesting: "กำลังรอการอนุญาตจากเบราว์เซอร์…",
    granted: "ได้รับตำแหน่งแล้ว กดเพื่อใช้ตำแหน่งนี้ต่อ",
    denied: "ไม่ได้รับอนุญาต คุณยังเลือกพิมพ์สถานที่หรือแผนแทนได้",
    unavailable: "อุปกรณ์นี้ส่งตำแหน่งไม่ได้ กรุณาเลือกพิมพ์สถานที่แทน",
    timeout: "ค้นหาตำแหน่งไม่ทันเวลา ลองอีกครั้งหรือเลือกพิมพ์สถานที่แทน",
  }[state];

  if (variant === "entry-card") {
    return (
      <div className="method-option">
        <button className="entry-card entry-card--indigo" type="button" onClick={requestLocation} disabled={state === "requesting"}>
          <span className="entry-card__top">
            <span className="entry-card__icon">{state === "granted" ? <MapPin size={22} /> : <LocateFixed size={22} />}</span>
            <span className="entry-card__number">02</span>
          </span>
          <span className="entry-card__copy">
            <strong>{state === "requesting" ? "กำลังขอ Current location…" : "ใช้ Current location"}</strong>
            <span>{state === "granted" ? "ใช้ตำแหน่งที่อนุญาตไว้แล้ว" : "อนุญาตตำแหน่งเพื่อค้นหาร้านใกล้คุณ"}</span>
          </span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p className="privacy-note" aria-live="polite">
          <ShieldCheck size={13} aria-hidden="true" /> {help}
        </p>
      </div>
    );
  }

  return (
    <div className="voice-row">
      <button className="voice-button" type="button" onClick={requestLocation} disabled={state === "requesting"}>
        {state === "granted" ? <MapPin size={19} /> : <LocateFixed size={19} />}
        {state === "requesting" ? "กำลังขอตำแหน่ง…" : state === "granted" ? "ใช้ตำแหน่งนี้แล้ว" : "ใช้ Current location"}
      </button>
      <p className="privacy-note" aria-live="polite">
        <ShieldCheck size={13} aria-hidden="true" /> {help}
      </p>
    </div>
  );
}
