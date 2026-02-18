interface BaalioLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "12px", tmSize: "5px" },
  sm: { fontSize: "14px", tmSize: "6px" },
  md: { fontSize: "18px", tmSize: "7px" },
  lg: { fontSize: "24px", tmSize: "9px" },
};

export function BaalioLogo({ size = "sm", className = "" }: BaalioLogoProps) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "'Satoshi', sans-serif",
        fontSize: s.fontSize,
        letterSpacing: "-0.06em",
        lineHeight: 1,
        background: "linear-gradient(135deg, #1a1a2e 0%, #4a4a6a 50%, #8a8aa5 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
      aria-label="ProFundr"
    >
      <span style={{ fontWeight: 400 }}>Pro</span>
      <span style={{ fontWeight: 400, fontStyle: 'italic' }}>Fundr</span>
      <span style={{
        fontSize: s.tmSize,
        verticalAlign: "super",
        marginLeft: "1px",
        fontWeight: 400,
        background: "linear-gradient(135deg, #4a4a6a, #8a8aa5)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>®</span>
    </span>
  );
}
