import { useEffect } from "react";

type Props = {
  onSolve: (token: string) => void;
  onReset?: () => void;
};

// ⚠️ 临时诊断版本 —— 只用于判断"点不动"是否 Cap 造成
// 诊断完成后立刻被自写 PoW 替换
export default function CapWidget({ onSolve }: Props) {
  useEffect(() => {
    // 给一个假 token，让业务代码能走到"按钮可点"阶段
    onSolve("DIAGNOSTIC_FAKE_TOKEN");
  }, [onSolve]);

  return (
    <div
      style={{
        padding: "12px 16px",
        background: "#e0f2e9",
        borderRadius: 8,
        color: "#0d7332",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      🟢 诊断组件已加载（Cap 已临时替换）
    </div>
  );
}
