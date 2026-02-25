interface ProfundrLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "13px" },
  sm: { fontSize: "16px" },
  md: { fontSize: "20px" },
  lg: { fontSize: "28px" },
};

export function ProfundrLogo({ size = "sm", className = "" }: ProfundrLogoProps) {
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
      profundr<span style={{ marginLeft: "-0.15em" }}>.</span>
    </span>
  );
}
