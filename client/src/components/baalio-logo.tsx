interface BaalioLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "12px", aaOffset: "-4px" },
  sm: { fontSize: "14px", aaOffset: "-4.5px" },
  md: { fontSize: "18px", aaOffset: "-6px" },
  lg: { fontSize: "24px", aaOffset: "-8px" },
};

export function BaalioLogo({ size = "sm", className = "" }: BaalioLogoProps) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 900,
        fontSize: s.fontSize,
        letterSpacing: "-0.08em",
        lineHeight: 1,
        textTransform: "lowercase",
      }}
      aria-label="baalio"
    >
      b
      <span style={{ display: "inline-block" }}>a</span>
      <span style={{ display: "inline-block", marginLeft: s.aaOffset }}>a</span>
      lio
    </span>
  );
}
