import React from "react";

export default function HistoryPanel({ history }) {
  const sorted = [...history].sort((a, b) => {
    const toMillis = (val) => {
      if (typeof val === "string") return Date.parse(val);
      if (val?.seconds) return val.seconds * 1000;
      return 0;
    };
    return toMillis(b.createdAt) - toMillis(a.createdAt);
  });

  const recent = sorted.slice(0, 5);

  const nameCounts = history.reduce((acc, entry) => {
    const name = entry.name ?? "（名前なし）";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{
      background: "rgba(255,255,255,0.95)",
      borderRadius: 12,
      padding: "0px",
      boxShadow: "0 4px 16px #bbb3",
      fontSize: "0.85rem",
      color: "#B1558C",
      minWidth: 300,
      display: "flex",
      justifyContent: "space-between",
      gap: "24px"
    }}>
      {/* 🔵 累積 */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 400, marginBottom: 5 }}>🎯 名前別</div>
        {Object.entries(nameCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count], i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "monospace"
            }}>
              <span>・{name}</span>
              <span>（{count}回）</span>
            </div>
        ))}
      </div>

      {/* 🟣 直近当たったメンバー */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 400, marginBottom: 5 }}>🕓 最近</div>
        {recent.length === 0 ? (
          <div style={{ color: "#aaa" }}>まだいません</div>
        ) : (
          recent.map((n, i) => {
            let date;
            if (typeof n.createdAt === "string") {
              date = new Date(Date.parse(n.createdAt));
            } else if (n.createdAt?.seconds) {
              date = new Date(n.createdAt.seconds * 1000);
            } else {
              date = null;
            }

            const formatted = date && !isNaN(date.getTime())
            ? date.toLocaleDateString("ja-JP", {
                month: "2-digit",
                day: "2-digit"
              }) 
            : "不明";

            return (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "monospace"
              }}>
                <span>・{n.name ?? '（名前なし）'}</span>
                <span>（{formatted}）</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
