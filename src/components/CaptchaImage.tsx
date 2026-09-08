const CAPTCHA_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function createCaptcha() {
  const result: string[] = [];

  while (result.length < 4) {
    const char =
      CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];

    if (!result.includes(char)) {
      result.push(char);
    }
  }

  return result;
}

export function CaptchaImage({
  characters,
  refreshKey,
}: {
  characters: string[];
  refreshKey: number;
}) {
  const rotations = [-10, 8, -6, 10];

  return (
    <svg
      viewBox="0 0 96 44"
      className="h-full w-full"
      role="img"
      style={{
        colorScheme: "light",
        forcedColorAdjust: "none",
        filter: "none",
        opacity: 1,
        isolation: "isolate",
      }}
      aria-label="图形验证码"
      preserveAspectRatio="none"
    >
      <rect width="96" height="44" rx="8" fill="#ffffff" />

      {Array.from({ length: 28 }, (_, index) => (
        <circle
          key={`dot-${refreshKey}-${index}`}
          cx={Math.random() * 92 + 2}
          cy={Math.random() * 40 + 2}
          r={index % 4 === 0 ? 1.1 : 0.6}
          fill="#555555"
          opacity={index % 3 === 0 ? 0.65 : 0.38}
        />
      ))}

      <path
        d="M1 9 C20 31 31 4 48 22 S74 7 95 31"
        fill="none"
        stroke="#666666"
        strokeWidth="1.1"
        opacity="0.72"
      />

      <path
        d="M1 35 C19 7 35 38 53 12 S76 34 95 7"
        fill="none"
        stroke="#888888"
        strokeWidth="0.9"
        opacity="0.82"
      />

      {characters.map((char, index) => {
        const x = 14 + index * 23;
        const y = 28 + (index % 2 === 0 ? -2 : 2);

        return (
          <text
            key={`${char}-${refreshKey}-${index}`}
            x={x}
            y={y}
            fill={index % 2 === 0 ? "#111111" : "#333333"}
            fontSize="20"
            fontWeight="700"
            fontFamily="Arial, sans-serif"
            textAnchor="middle"
            transform={`rotate(${rotations[index]} ${x} 25)`}
          >
            {char}
          </text>
        );
      })}
    </svg>
  );
}
