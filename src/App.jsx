import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NameListEditor from "./NameListEditor";
import { addHistory, fetchHistory } from "./fireHistory";
import HistoryPanel from "./HistoryPanel";
import { fetchNames, addName, deleteName } from "./fireNames";
import { clearAllHistory } from "./fireHistory";
import FlyingCupid from "./components/FlyingCupid";

function getAngle(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // 🛠️ 画像基準の補正：デフォルト状態で右上20°を向いているため
  angle -= 20;

  // ✨ 回転角度を -180~180 の範囲に維持
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;

  return angle;
}

export function makeBalloonPositions(count) {
  return Array.from({ length: count }).map(() => ({
    top: `${10 + Math.random() * 60}%`,     // 高さ: 10% ~ 70%
    left: `${5 + Math.random() * 90}%`      // 左右: 5% ~ 95%
  }));
}

export const balloonColors = [
  "#FFDBDB", "#B4E2FF", "#FFF1B8", "#D4F8E8",
  "#FFCEC7", "#D6C8FF", "#FFF6C3", "#CAF0F8",
  "#FFE8F0", "#FBE7C6", "#C9F9D8", "#FFD5EC", "#B6E5FF"
];

export function BalloonSVG({ color = "#FF4F8B" }) {
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

export function Note({ name, onClose }) {
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
        background: "#FFF0F5",
        padding: "2rem 3rem",
        borderRadius: "1rem",
        fontSize: "2.5rem",
        fontWeight: 600,
        color: "#A05270",
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

export function Arrow({ start, end, show }) {
  if (!show) return null;
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;

  return (
    <motion.div
      initial={{ x: start.x, y: start.y, rotate: angle, opacity: 1 }}
      animate={{ x: end.x, y: end.y, rotate: angle, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.5, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 48,
        height: 24,
        zIndex: 1000,
        pointerEvents: "none"
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}arrow.png`}
        alt="arrow"
        style={{
          width: "100%",
          height: "auto",
          objectFit: "contain",
          transformOrigin: "left center"
        }}
        onError={(e) => {
          e.target.style.display = "none";
          console.warn("arrow.png 이미지가 로드되지 않았습니다.");
        }}
      />
    </motion.div>
  );
}

export default function App() {
  const cupidRef = useRef(null);
  const [showEditor, setShowEditor] = useState(true);
  const [hideTimer, setHideTimer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bgmSrc] = useState(`${import.meta.env.BASE_URL}whistle.mp3`);
  const [names, setNames] = useState([]);
  const [balloonPositions, setBalloonPositions] = useState([]);
  const [hitIdx, setHitIdx] = useState(null);
  const bgmRef = useRef(null);
  const hasPlayedRef = useRef(false);
  const [volume, setVolume] = useState(0.6);
  const [showNote, setShowNote] = useState(false);
  const [arrowAnim, setArrowAnim] = useState(false);
  const [history, setHistory] = useState([]);
  const [showFlyingCupid, setShowFlyingCupid] = useState(false);
  const [flyingCupidPos, setFlyingCupidPos] = useState({ x: 0, y: 0 });
  const [cupidAngle, setCupidAngle] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [cupidFlip, setCupidFlip] = useState(1);
  const [cupidMove, setCupidMove] = useState({ x: 0, y: 0 });
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      const nearRight = window.innerWidth - e.clientX < 100 && e.clientY < 300;
      if (nearRight) {
        if (hideTimer) clearTimeout(hideTimer);
        setShowEditor(true);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hideTimer]);

  const handleMouseEnterEditor = () => {
    if (hideTimer) clearTimeout(hideTimer);
    setShowEditor(true);
  };

  const handleMouseLeaveEditor = () => {
    const timer = setTimeout(() => setShowEditor(false), 1000);
    setHideTimer(timer);
  };

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
    setHistory([]);
  };

  const handleDeleteName = async (id) => {
    await deleteName(id);
    setNames(prev => prev.filter(n => n.id !== id));
  };

  const getCupidXY = () => {
    const rect = cupidRef.current?.getBoundingClientRect();
    return rect
      ? { x: rect.left + rect.width * 0.2, y: rect.top + rect.height * 0.4 }
      : { x: window.innerWidth / 2, y: window.innerHeight - 240 };
  };

  const getBalloonXY = (idx) => {
    const el = balloonRefs.current[idx];
    if (!el) return { x: 300, y: 100 };
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 4
    };
  };

    // 日本語コメント: 当選履歴から名前ごとの当選回数を集計
  const buildWinCountMap = (historyList) => {
    const map = new Map();

    for (const item of historyList || []) {
      const name = item?.name;
      if (!name) continue;
      map.set(name, (map.get(name) || 0) + 1);
    }

    console.debug("[weighted-draw] winCountMap", Object.fromEntries(map));
    return map;
  };

  // 日本語コメント: 当選回数が多い人ほど当たりにくくする重み付き抽選
  const pickWeightedIndex = (namesList, historyList, penaltyFactor = 0.7) => {
    if (!namesList || namesList.length === 0) {
      console.warn("[weighted-draw] namesList is empty");
      return -1;
    }

    const winCountMap = buildWinCountMap(historyList);

    const weighted = namesList.map((person, index) => {
      const winCount = winCountMap.get(person.name) || 0;
      const weight = 1 / (1 + winCount * penaltyFactor);

      return {
        index,
        id: person.id,
        name: person.name,
        winCount,
        weight,
      };
    });

    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);

    if (totalWeight <= 0) {
      console.warn("[weighted-draw] totalWeight <= 0, fallback random");
      return Math.floor(Math.random() * namesList.length);
    }

    let r = Math.random() * totalWeight;

    for (const item of weighted) {
      r -= item.weight;
      if (r <= 0) {
        console.debug("[weighted-draw] picked", {
          pickedIndex: item.index,
          pickedId: item.id,
          pickedName: item.name,
          pickedWinCount: item.winCount,
          pickedWeight: item.weight,
          totalWeight,
          weighted,
        });
        return item.index;
      }
    }

    // 日本語コメント: 浮動小数点誤差対策
    const fallback = weighted[weighted.length - 1].index;
    console.debug("[weighted-draw] fallback last index", {
      fallback,
      totalWeight,
      weighted,
    });
    return fallback;
  };

    const shoot = async () => {
    try {
      if (hitIdx !== null || names.length === 0) return;

      // 日本語コメント: 当選回数が多い人ほど当たりにくくする重み付き抽選
      const idx = pickWeightedIndex(names, history, 0.7);
      if (idx < 0) {
        console.warn("[weighted-draw] invalid idx");
        return;
      }

      console.debug("[weighted-draw] final selected", {
        idx,
        id: names[idx]?.id,
        name: names[idx]?.name,
      });

      const cupidPos = getCupidXY();
      const balloonPos = getBalloonXY(idx);

      const dx = balloonPos.x - cupidPos.x;
      const dy = balloonPos.y - cupidPos.y;

      let angle = Math.atan2(dy, dx) * (180 / Math.PI) - 20;

      // 日本語コメント: 左右反転判定
      const flip = dx < 0 ? -1 : 1;
      setCupidFlip(flip);

      // 日本語コメント: scaleX=-1 の場合は角度補正
      if (flip === -1) {
        angle = angle + 180;
        if (angle > 180) angle -= 360;
      }

      setCupidAngle(angle);

      setCupidMove({
        x: dx * 0.1,
        y: dy * 0.1,
      });

      setShooting(true);
      setArrowAnim(true);
      setHitIdx(idx);

      if (!bgmRef.current) {
        const bgm = new Audio(`${import.meta.env.BASE_URL}whistle.mp3`);
        bgm.loop = true;
        bgm.volume = 0.4;
        try {
          await bgm.play();
          bgmRef.current = bgm;
        } catch (err) {
          console.warn("BGM 失敗", err);
        }
      }

      setTimeout(() => {
        setShowFlyingCupid(false);
      }, 1600);

      setTimeout(async () => {
        const se = new Audio(`${import.meta.env.BASE_URL}arrow.mp3`);
        se.volume = 0.6;
        se.play();

        setArrowAnim(false);
        setShowNote(true);

        // 日本語コメント: 履歴保存（ログ確認用）
        console.debug("[history] add", {
          id: names[idx]?.id,
          name: names[idx]?.name,
        });

        await addHistory(names[idx]);
        const updated = await fetchHistory();
        setHistory(updated);
      }, 3000);

    } catch (e) {
      console.error("[weighted-draw] shoot failed", e);
    }
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
      background: "linear-gradient(#FFFBFC 0%, #FDEFF4 100%)",
      overflow: "hidden",
      position: "relative"
    }}>
      <motion.div
        onMouseEnter={handleMouseEnterEditor}
        onMouseLeave={handleMouseLeaveEditor}
        initial={{ opacity: 1, x: 0 }}
        animate={showEditor ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "absolute",
          top: 12,
          right: 24,
          zIndex: 10,
          background: "rgba(255, 250, 255, 0.6)",
          padding: "16px",
          borderRadius: "16px",
          border: "2px solid #F6D5E1",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          pointerEvents: showEditor ? "auto" : "none"
        }}
      >
        <NameListEditor onAddName={handleAddName} onClear={handleClearAll} onClearHistory={handleClearHistory} />
        {names.map(n => (
          <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            <span style={{ fontSize: "1rem", marginRight: "3rem", flex: 1, textAlign: "right", display: "inline-block", fontFamily: "sans-serif" }}>{n.name}</span>
            <button onClick={() => handleDeleteName(n.id)} style={{
              background: "#FEC8D8",
              color: "#7A4F5C",
              border: "none",
              borderRadius: "8px",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600
            }}>削除</button>
          </div>
        ))}
      </motion.div>

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
              duration: 3.0,
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
      <FlyingCupid
  show={showFlyingCupid}
  x={flyingCupidPos.x}
  y={flyingCupidPos.y}
  angle={flyingCupidPos.angle || 0}
/>
      <motion.div
        style={{
          position: "fixed",
          left: "50%",
          bottom: "8px",
          transform: "translateX(-50%)",
          zIndex: 3,
          width: cupidWidth,
          height: cupidHeight,
          pointerEvents: "auto",
          cursor: hitIdx === null && names.length > 0 ? "pointer" : "not-allowed",
        }}
        animate={{
          scale: shooting ? [1, 1.5, 1] : 1,
          x: shooting ? cupidMove.x : [0, -70, 70, 0],
          y: shooting ? cupidMove.y : [0, -8, -14, 0],
        }}
        transition={{
          duration: shooting ? 1.3 : 8,
          repeat: shooting ? 0 : Infinity,
          ease: "easeInOut"
        }}
        onClick={shoot}
        title="キューピッドをクリックして矢を放とう！"
        onAnimationComplete={() => {
          setShooting(false);
          setCupidMove({ x: 0, y: 0 });
        }}
      >
        <img
          ref={cupidRef}
          src={`${import.meta.env.BASE_URL}cupid.png`}
          alt="キューピッド"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `rotate(${cupidAngle}deg) ${cupidFlip === -1 ? "scaleX(-1)" : ""}`,
            transformOrigin: "center center",
            transition: "transform 0.4s ease-out"
          }}
          draggable={false}
        />
      </motion.div>



      <div style={{ position: "fixed", left: 16, bottom: 24, zIndex: 10 }}>
        <HistoryPanel history={history} />
      </div>

      <AnimatePresence>
        {showNote && hitIdx !== null && <Note name={names[hitIdx].name} onClose={handleCloseNote} />}
      </AnimatePresence>

      <div style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        background: "#FAF3F0",
        borderRadius: "16px",
        padding: "14px 18px",
        border: "2px solid #F8D4D8",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "14px"
      }}>
        <button
          style={{
            background: "#FDCEDF",
            color: "#8B4D60",
            border: "none",
            borderRadius: "12px",
            padding: "6px 14px",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
          onClick={() => {
            if (!hasPlayedRef.current) {
              const bgm = new Audio(bgmSrc);
              bgm.loop = true;
              bgm.volume = volume;
              bgm.play().then(() => {
                bgmRef.current = bgm;
                hasPlayedRef.current = true;
                setIsPlaying(true);
              }).catch(err => {
                console.warn("手動再生失敗:", err);
              });
            } else if (bgmRef.current && !isPlaying) {
              bgmRef.current.play().then(() => {
                setIsPlaying(true);
              }).catch(err => {
                console.warn("再再生失敗:", err);
              });
            }
          }}
        >
          🎵 再生
        </button>
        <button
          style={{
            background: "#FDCEDF",
            color: "#8B4D60",
            border: "none",
            borderRadius: "12px",
            padding: "6px 14px",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
          onClick={() => {
            if (bgmRef.current) {
              bgmRef.current.pause();
              bgmRef.current.currentTime = 0;
              setIsPlaying(false);
              hasPlayedRef.current = false;
            }
          }}
        >
          ⏹ 停止
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => {
            const newVol = parseFloat(e.target.value);
            setVolume(newVol);
            if (bgmRef.current) {
              bgmRef.current.volume = newVol;
            }
          }}
          style={{
            accentColor: "#F4A9B7",
            height: "8px",
            borderRadius: "6px"
          }}
        />
      </div>

      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 16,
        textAlign: "center",
        zIndex: 3,
        fontSize: "2.1rem",
        fontWeight: 600,
        color: "#437",
        textShadow: "0 2px 8px #fff, 0 2px 4px #bbb",
        letterSpacing: "0.03em"
      }}>
        次回！よろし〜くお願いし〜ます！
      </div>
    </div>
  );
}
