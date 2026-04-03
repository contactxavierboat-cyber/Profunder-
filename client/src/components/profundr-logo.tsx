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
      <svg
        width={s.iconSize}
        height={s.iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: "block", flexShrink: 0 }}
      >
        <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
        <path d="M12 2v20" />
        <path d="M7.5 7.5C9 8.5 10 10 10.5 12" />
        <path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
      </svg>
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
