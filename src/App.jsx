import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NameListEditor from "./NameListEditor";
import { addHistory, fetchHistory } from "./fireHistory";
import HistoryPanel from "./HistoryPanel";
import { fetchNames, addName, deleteName } from "./fireNames";
import { clearAllHistory } from "./fireHistory";

function makeBalloonPositions(count) {
  return Array.from({ length: count }).map(() => ({
    top: `${18 + Math.random() * 25}%`,
    left: `${9 + Math.random() * 74}%`
  }));
}

const balloonColors = [
  "#FF4F8B", "#57A5FF", "#FFD93D", "#64E291",
  "#FF7B54", "#B084CC", "#FFA41B", "#4ECDC4",
  "#FFD6E0", "#F9D923", "#A1E3D8", "#E07A5F", "#A3D8F4"
];

function BalloonSVG({ color = "#FF4F8B" }) {
  return (
    <svg width="80" height="160" viewBox="0 0 80 160" fill="none">
      <ellipse cx="40" cy="48" rx="32" ry="40" fill={color} />
      <ellipse cx="27" cy="33" rx="8" ry="12" fill="white" opacity="0.5" />
      <path d="M38 88 Q40 95 42 88" stroke="#B9B9B9" strokeWidth="4" fill="none" />
      <path d="M40 88 Q35 120 40 160 Q45 120 40 88" stroke="#B9B9B9" strokeWidth="2" fill="none" />
      <ellipse cx="40" cy="88" rx="7" ry="5" fill="#FF8BB4" />
    </svg>
  );
}

function Note({ name, onClose }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1.6, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ duration: 0.9 }}
      style={{
        position: "fixed",
        top: "38%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#fffbe7",
        padding: "2rem 3rem",
        borderRadius: "1rem",
        fontSize: "2.5rem",
        fontWeight: 600,
        color: "#C13D6E",
        boxShadow: "0 4px 32px rgba(0,0,0,0.19)",
        zIndex: 100
      }}
      onClick={onClose}
      title="クリックして閉じる"
    >
      {name}
    </motion.div>
  );
}

function CuteArrowSVG() {
  return (
    <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
      <rect x="6" y="10" width="28" height="4" rx="2" fill="#FFB6C1" />
      <ellipse cx="7" cy="12" rx="4" ry="4" fill="#87CEEB" />
      <ellipse cx="44" cy="12" rx="5" ry="5" fill="#FF6381" />
      <path d="M43,12 Q47,14 44,17 Q41,14 43,12" fill="#FF6381" />
    </svg>
  );
}

function Arrow({ start, end, show }) {
  if (!show) return null;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  return (
    <motion.div
      initial={{ x: start.x, y: start.y, rotate: angle * 180 / Math.PI }}
      animate={{ x: end.x, y: end.y, rotate: angle * 180 / Math.PI }}
      transition={{ duration: 3, ease: "easeInOut" }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 48,
        height: 24,
        pointerEvents: "none",
        zIndex: 1000
      }}
    >
      <CuteArrowSVG />
    </motion.div>
  );
}

export default function App() {
  const [names, setNames] = useState([]);
  const [balloonPositions, setBalloonPositions] = useState([]);
  const [hitIdx, setHitIdx] = useState(null);
  const [showNote, setShowNote] = useState(false);
  const [arrowAnim, setArrowAnim] = useState(false);
  const [history, setHistory] = useState([]);
  const balloonRefs = useRef([]);
  const cupidWidth = 140;
  const cupidHeight = 160;

  useEffect(() => {
    const loadNames = async () => {
      const fetched = await fetchNames();
      setNames(fetched);
    };
    const loadHistory = async () => {
      const h = await fetchHistory();
      setHistory(h);
    };
    loadNames();
    loadHistory();
  }, []);

  useEffect(() => {
    setBalloonPositions(makeBalloonPositions(names.length));
  }, [names.length]);

  const handleAddName = async (nameStr) => {
    const newDoc = await addName(nameStr);
    setNames(prev => [...prev, { id: newDoc.id, name: nameStr }]);
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm("すべての名前を削除しますか？");
    if (!confirmed) return;
    for (const n of names) {
      await deleteName(n.id);
    }
    setNames([]);
  };

  const handleClearHistory = async () => {
    const confirmed = window.confirm("すべての履歴を削除しますか？");
    if (!confirmed) return;
  
    await clearAllHistory();
    setHistory([]); // 화면에서도 지우기
  };  

  const handleDeleteName = async (id) => {
    await deleteName(id);
    setNames(prev => prev.filter(n => n.id !== id));
  };

  const getCupidXY = () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight - 90
  });
  const getBalloonXY = (idx) => {
    if (!balloonRefs.current[idx]) return { x: 300, y: 100 };
    const rect = balloonRefs.current[idx].getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + 30 };
  };

  const shoot = async () => {
    if (hitIdx !== null || names.length === 0) return;
    const audio = new Audio(`${import.meta.env.BASE_URL}whistle.mp3`);
    audio.play();

    const idx = Math.floor(Math.random() * names.length);
    setHitIdx(idx);
    setArrowAnim(true);
  
    setTimeout(async () => {
      const se = new Audio(`${import.meta.env.BASE_URL}arrow.mp3`);
      se.volume = 0.6;
      se.play();
      
      setArrowAnim(false);
      setShowNote(true);
      await addHistory(names[idx]);
      const updated = await fetchHistory();
      setHistory(updated);
    }, 3000);
  };

  const handleCloseNote = () => {
    setShowNote(false);
    setTimeout(() => setHitIdx(null), 700);
  };

  let arrowStart = getCupidXY();
  let arrowEnd = hitIdx !== null ? getBalloonXY(hitIdx) : arrowStart;

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(#87ceeb 0%, #fff 100%)",
      overflow: "hidden",
      position: "relative"
    }}>
      <div style={{ position: "absolute", top: 12, right: 24, zIndex: 10 }}>
      <NameListEditor onAddName={handleAddName}onClear={handleClearAll}onClearHistory={handleClearHistory}/>
        {names.map(n => (
          <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <span style={{fontSize: "1rem",marginRight: "3rem",flex: 1,textAlign: "right",display: "inline-block", fontFamily:"sans-serif"}}> {n.name}
              </span>
            <button onClick={() => handleDeleteName(n.id)} style={{ background: "#ccc", border: "none", borderRadius: "4px", padding: "2px 8px", cursor: "pointer" }}>削除</button>
          </div>
        ))}
      </div>

      {names.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "6rem", fontSize: "2.2rem", color: "#b1558c", fontWeight: "bold", letterSpacing: "0.05em", textShadow: "0 1px 4px #fff, 0 1px 8px #e5e5f5" }}>
          名前を追加してください！
        </div>
      ) : (
        names.map((nameObj, i) => (
          <motion.div
            key={nameObj.id}
            ref={el => (balloonRefs.current[i] = el)}
            style={{
              position: "absolute",
              ...balloonPositions[i],
              zIndex: hitIdx === i ? 2 : 1,
              pointerEvents: hitIdx === null ? "auto" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
            animate={hitIdx === i && !arrowAnim && showNote ? {
              y: [0, 80, 600],
              opacity: [1, 0.9, 0]
            } : {
              x: [0, -7, 7, 0],
              y: [0, -6, 6, 0],
              rotate: [0, -3, 3, 0]
            }}
            transition={hitIdx === i ? {
              duration: 1.2,
              times: [0, 0.6, 1],
              ease: "easeIn"
            } : {
              duration: 7 + (i % 4.5) + (i * 0.3),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <BalloonSVG color={balloonColors[i % balloonColors.length]} />
          </motion.div>
        ))
      )}

      <Arrow show={arrowAnim && hitIdx !== null} start={arrowStart} end={arrowEnd} />

      <motion.div
        style={{
          position: "fixed",
          left: "50%",
          bottom: "8px",
          transform: "translateX(-50%)",
          zIndex: 3,
          width: cupidWidth,
          height: cupidHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "right",
          pointerEvents: "auto",
          cursor: hitIdx === null && names.length > 0 ? "pointer" : "not-allowed"
        }}
        animate={{ x: [0, -70, 70, 0], y: [0, -8, -14, 0], rotate: [0, -6, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        onClick={shoot}
        title="キューピッドをクリックして矢を放とう！"
      >
        <img src={`${import.meta.env.BASE_URL}cupid.png`} alt="キューピッド" style={{ width: cupidWidth, height: cupidHeight, objectFit: "contain", pointerEvents: "none", userSelect: "none" }} draggable={false} />
      </motion.div>

      <div style={{ position: "fixed", left: 16, bottom: 24, zIndex: 10 }}>
        <HistoryPanel history={history} />
      </div>

      <AnimatePresence>
        {showNote && hitIdx !== null && <Note name={names[hitIdx].name} onClose={handleCloseNote} />}
      </AnimatePresence>

      <div style={{ position: "absolute", left: 0, right: 0, top: 16, textAlign: "center", zIndex: 3, fontSize: "2.1rem", fontWeight: 600, color: "#437", textShadow: "0 2px 8px #fff, 0 2px 4px #bbb", letterSpacing: "0.03em" }}>
        次は君に任せた！
      </div>
    </div>
  );
}
