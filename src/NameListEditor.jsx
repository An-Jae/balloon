import React, { useState } from "react";

export default function NameListEditor({ onAddName, onClear, onClearHistory }) {
  const [newName, setNewName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddName(newName.trim());
    setNewName("");
  };

  const buttonStyle = {
    padding: "0.3rem 0.9rem",
    fontSize: "0.8rem",
    borderRadius: "4px",
    border: "none",
    width: "5rem",
    textAlign: "center",
    color: "#fff",
    cursor: "pointer",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "sans-serif"
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5rem", marginTop: "0.5rem" }}>
      <input
        type="text"
        value={newName}
        onChange={e => setNewName(e.target.value)}
        placeholder="名前を入力"
        style={{
          fontSize: "1rem",
          padding: "0.3rem 0.7rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
          width: "90%",
          maxWidth: "300px"
        }}
      />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" style={{ ...buttonStyle, background: "#FF8BB4" }}>
          追加
        </button>
        <button type="button" onClick={onClear} style={{ ...buttonStyle, background: "#bbb" }}>
          名前削除
        </button>
        <button type="button" onClick={onClearHistory} style={{ ...buttonStyle, background: "#999" }}>
          履歴削除
        </button>
      </div>
    </form>
  );
}
