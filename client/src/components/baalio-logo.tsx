interface BaalioLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "11px", aaSize: "12px", aaOffset: "-3px" },
  sm: { fontSize: "13px", aaSize: "14px", aaOffset: "-3.5px" },
  md: { fontSize: "16px", aaSize: "17px", aaOffset: "-4.5px" },
  lg: { fontSize: "22px", aaSize: "24px", aaOffset: "-6px" },
};

export function BaalioLogo({ size = "sm", className = "" }: BaalioLogoProps) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 800,
        fontSize: s.fontSize,
        letterSpacing: "-0.06em",
        lineHeight: 1,
        textTransform: "lowercase",
      }}
      aria-label="baalio"
    >
      <span>b</span>
      <span style={{ position: "relative", display: "inline-block" }}>
        <span>a</span>
        <span
          style={{
            position: "relative",
            marginLeft: s.aaOffset,
            fontSize: s.aaSize,
            opacity: 0.7,
          }}
        >
          a
        </span>
      </span>
      <span>lio</span>
    </span>
  );
}
