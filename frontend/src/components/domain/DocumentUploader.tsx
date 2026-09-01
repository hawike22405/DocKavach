"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import clsx from "clsx";

const MAX_BYTES = 2 * 1024 * 1024;

interface DocumentUploaderProps {
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}

export function DocumentUploader({ imageUrl, onChange }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG or PNG).");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Image exceeds the 2MB limit — compress before uploading.");
        return;
      }
      setError(null);
      onChange(URL.createObjectURL(file));
    },
    [onChange]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={clsx(
          "relative flex h-48 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-center transition-colors cursor-pointer",
          isDragging ? "border-accent bg-accent/10" : "border-border hover:border-slate-500"
        )}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="Uploaded document preview" className="h-full w-full rounded-md object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              aria-label="Remove uploaded document"
              className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1 text-slate-200 hover:bg-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-7 w-7 text-slate-500" aria-hidden="true" />
            <p className="text-sm text-slate-300">Drag a document image here, or click to browse</p>
            <p className="text-xs text-slate-500">Passport or Visa · JPG/PNG · up to 2MB</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {imageUrl && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Document image ready
        </p>
      )}
    </div>
  );
}
