interface BaalioLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { fontSize: "12px", tmSize: "5px", eyeW: 8, eyeH: 5, pupil: 2, gap: "1px" },
  sm: { fontSize: "14px", tmSize: "6px", eyeW: 10, eyeH: 6, pupil: 2.5, gap: "1.5px" },
  md: { fontSize: "18px", tmSize: "7px", eyeW: 13, eyeH: 8, pupil: 3, gap: "2px" },
  lg: { fontSize: "24px", tmSize: "9px", eyeW: 17, eyeH: 10, pupil: 4, gap: "2.5px" },
};

function Eye({ w, h, pupil }: { w: number; h: number; pupil: number }) {
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "inline-block", verticalAlign: "middle", marginBottom: "0.08em" }}
    >
      <ellipse
        cx={w / 2}
        cy={h / 2}
        rx={w / 2 - 0.5}
        ry={h / 2 - 0.5}
        fill="none"
        stroke="#1a1a2e"
        strokeWidth={1.2}
      />
      <circle cx={w / 2} cy={h / 2} r={pupil} fill="#1a1a2e" />
    </svg>
  );
}

export function BaalioLogo({ size = "sm", className = "" }: BaalioLogoProps) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
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
      <span>b</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: s.gap, margin: "0 1px" }}>
        <Eye w={s.eyeW} h={s.eyeH} pupil={s.pupil} />
        <Eye w={s.eyeW} h={s.eyeH} pupil={s.pupil} />
      </span>
      <span style={{ color: "#4a4a6a" }}>lio</span>
      <span style={{ fontSize: s.tmSize, verticalAlign: "super", marginLeft: "1px", color: "#4a4a6a", fontWeight: 400 }}>®</span>
    </span>
  );
}
