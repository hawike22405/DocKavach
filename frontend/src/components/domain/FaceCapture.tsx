"use client";

import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FaceCaptureProps {
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}

export function FaceCapture({ imageUrl, onChange }: FaceCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [cameraError, setCameraError] = useState(false);

  const capture = () => {
    const shot = webcamRef.current?.getScreenshot();
    if (shot) onChange(shot);
  };

  return (
    <div>
      <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-md border border-border bg-slate-950">
        {imageUrl ? (
          <img src={imageUrl} alt="Captured live photo" className="h-full w-full object-cover" />
        ) : cameraError ? (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <UserRound className="h-7 w-7 text-slate-500" aria-hidden="true" />
            <p className="text-xs text-slate-500">Camera unavailable — check browser permissions</p>
          </div>
        ) : (
          <Webcam ref={webcamRef} audio={false} mirrored screenshotFormat="image/jpeg" onUserMediaError={() => setCameraError(true)} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="mt-2 flex justify-center">
        {imageUrl ? (
          <Button variant="ghost" onClick={() => onChange(null)}>
            <RefreshCw className="h-4 w-4" /> Retake
          </Button>
        ) : (
          <Button variant="primary" onClick={capture} disabled={cameraError}>
            <Camera className="h-4 w-4" /> Capture photo
          </Button>
        )}
      </div>
    </div>
  );
}
