// src/components/theme/ColorWheelPicker.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Copy, Check, Sparkles, RefreshCw } from "lucide-react";
import "./ColorWheelPicker.css";

// ==========================================
// COLOR MATH HELPERS (HSV <-> RGB <-> HEX)
// ==========================================

export function rgbToHex(r, g, b) {
  const toH = (n) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

export function hexToRgb(hex) {
  if (!hex) return { r: 255, g: 101, b: 0 };
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (clean.length !== 6) return { r: 255, g: 101, b: 0 };
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 101, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return { h, s, v };
}

export function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rPrime = 0,
    gPrime = 0,
    bPrime = 0;
  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }
  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

// Popular curated presets for fast 1-click selection
const PRESETS = [
  { name: "Brand Orange", hex: "#ff6500" },
  { name: "Golden Amber", hex: "#ffb703" },
  { name: "Pastel Yellow", hex: "#ffdb61" },
  { name: "Emerald Mint", hex: "#10b981" },
  { name: "Cyan Pulse", hex: "#06b6d4" },
  { name: "Electric Blue", hex: "#3b82f6" },
  { name: "Royal Purple", hex: "#8b5cf6" },
  { name: "Vivid Rose", hex: "#f43f5e" },
];

export default function ColorWheelPicker({
  value = "#ff6500",
  onChange,
  size = 230,
}) {
  const containerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);

  // Internal HSV state
  const [hsv, setHsv] = useState(() => {
    const { r, g, b } = hexToRgb(value);
    return rgbToHsv(r, g, b);
  });

  // Keep internal HSV updated if external value changes from outside
  useEffect(() => {
    const currentHex = rgbToHex(
      ...Object.values(hsvToRgb(hsv.h, hsv.s, hsv.v))
    ).toLowerCase();
    if (value && value.toLowerCase() !== currentHex) {
      const { r, g, b } = hexToRgb(value);
      setHsv(rgbToHsv(r, g, b));
    }
  }, [value]);

  const radius = size / 2;

  // Current calculated RGB and Hex
  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);

  // Pure hue for slider gradient track
  const pureHueRgb = hsvToRgb(hsv.h, hsv.s, 1.0);
  const pureHueHex = rgbToHex(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b);

  // Calculate handle position on wheel
  const handleAngleDeg = (hsv.h - 180 + 360) % 360;
  const handleAngleRad = (handleAngleDeg * Math.PI) / 180;
  const handleDist = Math.min(radius, hsv.s * radius);
  const handleX = radius + handleDist * Math.cos(handleAngleRad);
  const handleY = radius + handleDist * Math.sin(handleAngleRad);

  // Coordinate-to-HSV updater
  const updateHsvFromCoord = useCallback(
    (clientX, clientY) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const dx = x - radius;
      const dy = y - radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const sat = Math.min(1, Math.max(0, dist / radius));

      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angleDeg < 0) angleDeg += 360;
      const hue = (angleDeg + 180) % 360;

      const newHsv = { h: Math.round(hue), s: sat, v: hsv.v };
      setHsv(newHsv);

      const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      onChange?.(hex);
    },
    [radius, hsv.v, onChange]
  );

  // Drag handlers for wheel
  const handlePointerDown = (e) => {
    setIsDraggingWheel(true);
    updateHsvFromCoord(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isDraggingWheel) return;

    const onPointerMove = (e) => {
      updateHsvFromCoord(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      setIsDraggingWheel(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDraggingWheel, updateHsvFromCoord]);

  // Brightness slider change (0..1)
  const handleBrightnessChange = (e) => {
    const val = parseFloat(e.target.value);
    const newHsv = { ...hsv, v: val };
    setHsv(newHsv);

    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChange?.(hex);
  };

  // Direct Hex input change
  const handleHexInputChange = (e) => {
    let raw = e.target.value.trim();
    if (!raw.startsWith("#")) raw = `#${raw}`;
    if (raw.length === 7 && /^#[0-9A-Fa-f]{6}$/.test(raw)) {
      const rgb = hexToRgb(raw);
      const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(newHsv);
      onChange?.(raw);
    }
  };

  const copyHex = () => {
    navigator.clipboard?.writeText(currentHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="color-wheel-picker-card">
      <div className="cwp-header">
        <div className="cwp-title-row">
          <Sparkles size={16} className="cwp-icon" />
          <span>Chromatic Color Wheel</span>
        </div>
        <button
          type="button"
          className="cwp-reset-btn"
          title="Reset to Mone Orange"
          onClick={() => {
            const rgb = hexToRgb("#ff6500");
            setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
            onChange?.("#ff6500");
          }}
        >
          <RefreshCw size={13} />
          Reset
        </button>
      </div>

      {/* WHEEL CONTAINER WITH CSS VECTOR GRADIENTS (100% RETINA SHARP) */}
      <div className="cwp-wheel-wrapper">
        <div
          ref={containerRef}
          className="cwp-wheel-container"
          style={{ width: size, height: size }}
          onPointerDown={handlePointerDown}
        >
          {/* Chromatic color wheel surface matching reference disc */}
          <div className="cwp-wheel-disc" />

          {/* Draggable reticle ring (o) perfectly centered on coordinates */}
          <div
            className="cwp-reticle"
            style={{
              left: `${handleX}px`,
              top: `${handleY}px`,
              backgroundColor: currentHex,
            }}
          >
            <div className="cwp-reticle-inner" />
          </div>
        </div>
      </div>

      {/* CONTROLS (HEX BOX & SHADE SLIDER) */}
      <div className="cwp-controls-row">
        {/* HEX INPUT PILL WITH SWATCH */}
        <div className="cwp-hex-pill">
          <div
            className="cwp-swatch"
            style={{ backgroundColor: currentHex }}
          />
          <input
            type="text"
            className="cwp-hex-field"
            value={currentHex.toUpperCase()}
            onChange={handleHexInputChange}
            maxLength={7}
            aria-label="Hex color code"
          />
          <button
            type="button"
            className="cwp-copy-btn"
            onClick={copyHex}
            title={copied ? "Copied!" : "Copy Hex"}
          >
            {copied ? (
              <Check size={14} className="cwp-copied-icon" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>

        {/* BRIGHTNESS / SHADE SLIDER */}
        <div className="cwp-slider-wrapper">
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={hsv.v}
            onChange={handleBrightnessChange}
            className="cwp-slider"
            style={{
              background: `linear-gradient(to right, #000000 0%, ${pureHueHex} 100%)`,
            }}
            aria-label="Brightness shade slider"
          />
        </div>
      </div>

      {/* PRESETS ROW */}
      <div className="cwp-presets-section">
        <span className="cwp-presets-label">Popular Shades</span>
        <div className="cwp-presets-list">
          {PRESETS.map((p) => {
            const isSelected =
              currentHex.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                className={`cwp-preset-chip ${isSelected ? "active" : ""}`}
                style={{ backgroundColor: p.hex }}
                title={p.name}
                onClick={() => {
                  const rgb = hexToRgb(p.hex);
                  setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
                  onChange?.(p.hex);
                }}
              >
                {isSelected && (
                  <Check size={13} strokeWidth={3} color="#ffffff" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
