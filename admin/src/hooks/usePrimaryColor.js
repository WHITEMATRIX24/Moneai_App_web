import { useState, useEffect } from "react";

/**
 * Returns the current value of the --primary-color CSS custom property.
 * Re-renders the component whenever the user changes the accent colour
 * from the Platform Settings palette.
 */
export function usePrimaryColor(fallback = "#ff6500") {
  const getColor = () => {
    try {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary-color")
        .trim();
      return v || fallback;
    } catch {
      return fallback;
    }
  };

  const [color, setColor] = useState(getColor);

  useEffect(() => {
    // Watch for inline-style mutations on <html> (where JS sets the variable)
    const observer = new MutationObserver(() => {
      setColor(getColor());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Also update on first mount in case the value changed before mount
    setColor(getColor());

    return () => observer.disconnect();
  }, [fallback]);

  return color;
}
