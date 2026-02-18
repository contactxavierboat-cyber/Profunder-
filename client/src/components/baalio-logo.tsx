interface BaalioLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "12px" },
  sm: { fontSize: "15px" },
  md: { fontSize: "19px" },
  lg: { fontSize: "26px" },
};

export function BaalioLogo({ size = "sm", className = "" }: BaalioLogoProps) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: s.fontSize,
        fontWeight: 800,
        letterSpacing: "-0.05em",
        lineHeight: 1,
        background: "linear-gradient(135deg, #1a1a2e 0%, #4a4a6a 50%, #8a8aa5 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
      aria-label="profundr."
    >
      profundr.
    </span>
  );
}
