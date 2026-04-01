interface ProfundrLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "13px", iconSize: 16, gap: "5px" },
  sm: { fontSize: "16px", iconSize: 20, gap: "6px" },
  md: { fontSize: "20px", iconSize: 24, gap: "7px" },
  lg: { fontSize: "28px", iconSize: 32, gap: "8px" },
};

export function ProfundrLogo({ size = "sm", variant = "light", className = "" }: ProfundrLogoProps) {
  const s = SIZES[size];
  const color = variant === "light" ? "#fff" : "#111";
  return (
    <span
      className={`select-none ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: s.gap, lineHeight: 1, verticalAlign: "middle" }}
      aria-label="profundr."
    >
      <img
        src="/profundr-brain-logo.png"
        alt=""
        width={s.iconSize}
        height={s.iconSize}
        style={{
          display: "block",
          flexShrink: 0,
          filter: variant === "dark" ? "invert(1)" : "none",
        }}
      />
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: s.fontSize,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          color,
          lineHeight: 1,
          display: "block",
        }}
      >
        profundr<span style={{ marginLeft: "-0.15em" }}>.</span>
      </span>
    </span>
  );
}
