import { useEffect, useRef } from "react";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 192;
    const height = 88;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 固定浅色验证码画布，不跟随系统暗色模式改变
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // 噪点
    for (let i = 0; i < 56; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = i % 4 === 0 ? 1.5 : 0.8;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? "#555555" : "#888888";
      ctx.globalAlpha = i % 3 === 0 ? 0.6 : 0.35;
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // 第一条干扰曲线
    ctx.beginPath();
    ctx.moveTo(2, 18);
    ctx.bezierCurveTo(40, 62, 62, 8, 96, 44);
    ctx.bezierCurveTo(126, 74, 150, 12, 190, 62);
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = 0.65;
    ctx.stroke();

    // 第二条干扰曲线
    ctx.beginPath();
    ctx.moveTo(2, 70);
    ctx.bezierCurveTo(38, 14, 70, 78, 106, 28);
    ctx.bezierCurveTo(138, 4, 158, 72, 190, 14);
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.7;
    ctx.stroke();

    ctx.globalAlpha = 1;

    const rotations = [-10, 8, -6, 10];

    characters.forEach((char, index) => {
      const x = 28 + index * 45;
      const y = 57 + (index % 2 === 0 ? -4 : 4);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotations[index] * Math.PI) / 180);

      ctx.font =
        '700 40px Arial, "Helvetica Neue", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 固定深色字符
      ctx.fillStyle = index % 2 === 0 ? "#111111" : "#333333";
      ctx.fillText(char, 0, 0);

      ctx.restore();
    });
  }, [characters, refreshKey]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="图形验证码"
      className="h-full w-full rounded-lg"
      style={{
        display: "block",
        background: "#ffffff",
        colorScheme: "light",
        forcedColorAdjust: "none",
      }}
    />
  );
}
