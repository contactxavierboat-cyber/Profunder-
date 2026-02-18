interface BaalioLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showDot?: boolean;
}

const SIZES = {
  xs: { fontSize: "12px", dot: "12px", inner: "4px" },
  sm: { fontSize: "15px", dot: "15px", inner: "5px" },
  md: { fontSize: "19px", dot: "19px", inner: "6px" },
  lg: { fontSize: "26px", dot: "26px", inner: "8px" },
};

export function BaalioLogo({ size = "sm", className = "", showDot = true }: BaalioLogoProps) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      style={{ gap: "6px", lineHeight: 1 }}
      aria-label="profundr"
    >
      {showDot && (
        <span
          className="rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] flex items-center justify-center animate-logo-pulse shrink-0"
          style={{ width: s.dot, height: s.dot }}
        >
          <span className="rounded-full bg-white" style={{ width: s.inner, height: s.inner }} />
        </span>
      )}
      <span
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
      >
        profundr
      </span>
    </span>
  );
}
