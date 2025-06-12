// HistoryPanel.js
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

  return (
    <div style={{
      background: "rgba(255,255,255,0.97)",
      borderRadius: 8,
      padding: "12px 16px",
      boxShadow: "0 4px 16px #bbb3",
      fontSize: "1.1rem",
      color: "#B1558C",
      minWidth: 200
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>最近当たった人</div>
      {sorted.length === 0 ? (
        <div style={{ color: "#aaa" }}>まだいません</div>
      ) : (
        sorted.map((n, i) => {
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
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
              })
            : "不明";

          return (
            <div key={i}>・{n.name ?? '（名前なし）'}（{formatted}）</div>
          );
        })
      )}
    </div>
  );
}
