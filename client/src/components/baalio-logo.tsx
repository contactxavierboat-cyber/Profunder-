interface BaalioLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "14px", tmSize: "5px" },
  sm: { fontSize: "18px", tmSize: "6px" },
  md: { fontSize: "22px", tmSize: "7px" },
  lg: { fontSize: "30px", tmSize: "9px" },
};

export function BaalioLogo({ size = "sm", className = "" }: BaalioLogoProps) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "'Pacifico', cursive",
        fontSize: s.fontSize,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        color: "#1a1a2e",
      }}
      aria-label="ProFundr"
    >
      profundr
    </span>
  );
}
