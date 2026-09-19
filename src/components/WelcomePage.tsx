export default function WelcomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f8fa",
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      }}
    >
      <p
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: "#1a1a1a",
          letterSpacing: 1,
        }}
      >
        正在开发中
      </p>
    </main>
  );
}
