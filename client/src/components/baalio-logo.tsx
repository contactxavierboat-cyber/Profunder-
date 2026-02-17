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
        fontFamily: "'Inter', sans-serif",
        fontWeight: 900,
        fontSize: s.fontSize,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        textTransform: "lowercase",
        color: "#1a1a2e",
      }}
      aria-label="baalio"
    >
      <span>baa</span>
      <span style={{ color: "#4a4a6a" }}>lio</span>
      <span style={{ fontSize: s.tmSize, verticalAlign: "super", marginLeft: "1px", color: "#4a4a6a", fontWeight: 400 }}>®</span>
    </span>
  );
}
