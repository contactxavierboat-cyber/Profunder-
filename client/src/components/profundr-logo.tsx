interface ProfundrLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "13px", iconSize: 16 },
  sm: { fontSize: "16px", iconSize: 20 },
  md: { fontSize: "20px", iconSize: 26 },
  lg: { fontSize: "28px", iconSize: 34 },
};

export function ProfundrLogo({ size = "sm", variant = "light", className = "" }: ProfundrLogoProps) {
  const s = SIZES[size];
  const color = variant === "light" ? "#fff" : "#111";
  return (
    <span
      className={`inline-flex items-center select-none gap-1.5 ${className}`}
      style={{ lineHeight: 1 }}
      aria-label="profundr."
    >
      <img
        src="/profundr-brain-logo.png"
        alt=""
        width={s.iconSize}
        height={s.iconSize}
        style={{
          display: "block",
          borderRadius: "4px",
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
        }}
      >
        profundr<span style={{ marginLeft: "-0.15em" }}>.</span>
      </span>
    </span>
  );
}
