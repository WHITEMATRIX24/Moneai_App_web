// src/components/CustomSelect.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomSelect — a fully themed dropdown replacement for <select>.
 * Uses a React portal so the panel is never clipped by table cells,
 * overflow:hidden containers, or stacking-context issues.
 *
 * Props:
 *  value        – current selected value
 *  onChange     – (value) => void
 *  options      – [{ value, label }]  or  ["STRING", ...] (auto-mapped)
 *  disabled     – boolean
 *  className    – extra class on the trigger button
 *  size         – "md" (default) | "sm"
 *  placeholder  – shown when value matches no option
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  className = "",
  size = "md",
  placeholder = "Select…",
  fullWidth = false,
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});

  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Normalise options to { value, label }
  const normalised = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );

  const selected = normalised.find((o) => o.value === value);

  // Calculate panel position relative to the trigger
  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < 220 && rect.top > 220;

    setPanelStyle({
      position: "fixed",
      top: showAbove ? undefined : rect.bottom,
      bottom: showAbove ? window.innerHeight - rect.top : undefined,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
  }, []);

  // Open / close
  function toggle() {
    if (disabled) return;
    if (!open) reposition();
    setOpen((v) => !v);
  }

  // Close on outside pointer-down
  useEffect(() => {
    if (!open) return;
    function onPointer(e) {
      const clickedTrigger = triggerRef.current?.contains(e.target);
      const clickedPanel = panelRef.current?.contains(e.target);
      if (!clickedTrigger && !clickedPanel) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  function pick(val) {
    onChange(val);
    setOpen(false);
  }

  const panel = open
    ? createPortal(
        <ul
          ref={panelRef}
          className={`cs-panel cs-size-${size}`}
          style={panelStyle}
          role="listbox"
          aria-activedescendant={value}
        >
          {normalised.map((opt) => {
            const isActive = opt.value === value;
            return (
              <li
                key={opt.value}
                id={`cs-opt-${opt.value}`}
                role="option"
                aria-selected={isActive}
                className={`cs-option${isActive ? " cs-option-active" : ""}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  pick(opt.value);
                }}
              >
                <span>{opt.label}</span>
                {isActive && <Check size={13} className="cs-check" />}
              </li>
            );
          })}
        </ul>,
        document.body
      )
    : null;

  return (
    <div
      className={`cs-root cs-size-${size}${fullWidth ? " cs-full-width" : ""}${disabled ? " cs-disabled" : ""}${open ? " cs-open" : ""}`}
    >
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className={`cs-trigger ${className}`}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cs-label">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={size === "sm" ? 13 : 15} className="cs-chevron" />
      </button>

      {/* Portal-rendered panel — escapes any overflow/stacking context */}
      {panel}
    </div>
  );
}
