import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FlyingCupid({ show, x, y, angle = 0 }) {
  const needsFlip = angle > 90 && angle < -90;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{
            opacity: 1,
            scale: 0.6,
            rotate: angle,
            scaleX: 1 ? -1 : 1
          }}
          animate={{
            scale: 1.8,
            opacity: 0,
            rotate: angle,
            scaleX: 1 ? -1 : 1
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: x,
            top: y,
            zIndex: 9999,
            width: 140,
            height: 160,
            transformOrigin: "center center",
            pointerEvents: "none"
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}cupid.png`}
            alt="flying-cupid"
            style={{
              width: "100%",
              height: "auto",
              objectFit: "contain"
            }}
            onError={(e) => {
              e.target.style.display = "none";
              console.warn("큐피드 이미지가 로드되지 않았습니다.");
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
