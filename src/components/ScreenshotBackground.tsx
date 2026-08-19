/// <reference types="vite/client" />
import { useEffect, useRef, useState } from "react";
import { flow } from "../data/flow";

const BASE = import.meta.env.BASE_URL;

interface ScreenshotBackgroundProps {
  nodeId: string;
  onBackgroundChange?: (filename: string) => void;
}

export function ScreenshotBackground({ nodeId, onBackgroundChange }: ScreenshotBackgroundProps) {
  const [override, setOverride] = useState<string | null>(null);
  const lastFilename = useRef<string | null>(null);

  useEffect(() => {
    setOverride(null);
    window.scrollTo(0, 0);
  }, [nodeId]);

  useEffect(() => {
    if (override && override !== "cpf-form-05b.png" && override !== "cpf-form-02.png") {
      window.scrollTo(0, 0);
    }
  }, [override]);

  const node = flow.find((n) => n.id === nodeId);

  useEffect(() => {
    const filename = override ?? node?.background;
    if (filename) onBackgroundChange?.(filename);
  }, [override, nodeId]);

  const resolved = override ?? node?.background ?? null;
  const filename = resolved ?? lastFilename.current;
  if (resolved) lastFilename.current = resolved;

  const hotspot = override
    ? node?.hotspotChain?.[override]
    : node?.hotspot;

  if (!filename) {
    return <div className="screenshot-bg-fallback" />;
  }

  return (
    <div className="screenshot-bg-wrap">
      <img
        className="screenshot-bg-img"
        src={`${BASE}screenshots/${filename}`}
        alt=""
        aria-hidden="true"
      />
      {hotspot && (
        <button
          className="screenshot-hotspot"
          style={{
            top: hotspot.top,
            left: hotspot.left,
            width: hotspot.width,
            height: hotspot.height,
          }}
          onClick={() => setOverride(hotspot.nextBackground)}
          aria-label="Select contribution type"
        />
      )}
    </div>
  );
}
