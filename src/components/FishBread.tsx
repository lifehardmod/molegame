import { motion } from "framer-motion";
import type { Cell } from "../types/game";

interface FishBreadProps {
  cell: Cell;
  isSelected: boolean;
  cellSize: number;
}

export function FishBread({ cell, isSelected, cellSize }: FishBreadProps) {
  if (cell.isPopped) {
    return (
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute"
        style={{
          left: cell.col * cellSize,
          top: cell.row * cellSize,
          width: cellSize,
          height: cellSize,
        }}
      />
    );
  }

  return (
    <motion.div
      className="absolute flex items-center justify-center"
      style={{
        left: cell.col * cellSize,
        top: cell.row * cellSize,
        width: cellSize,
        height: cellSize,
        padding: cellSize * 0.08,
      }}
      animate={{
        scale: isSelected ? 1.1 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div
        className={`
          relative w-full h-full rounded-[30%] flex items-center justify-center
          transition-all duration-150
          ${
            isSelected
              ? "ring-[3px] ring-red-500 shadow-lg shadow-red-500/30"
              : ""
          }
        `}
        style={{
          background: isSelected
            ? "linear-gradient(145deg, #FFD194 0%, #E8A854 50%, #D4923A 100%)"
            : "linear-gradient(145deg, #F5D59A 0%, #D4A574 50%, #C49454 100%)",
          boxShadow: isSelected
            ? "0 4px 12px rgba(255, 107, 107, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)"
            : "inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* 붕어빵 눈 */}
        <div
          className="absolute rounded-full bg-gray-700"
          style={{
            width: cellSize * 0.08,
            height: cellSize * 0.08,
            top: "15%",
            left: "30%",
          }}
        />
        <div
          className="absolute rounded-full bg-gray-700"
          style={{
            width: cellSize * 0.08,
            height: cellSize * 0.08,
            top: "15%",
            right: "30%",
          }}
        />

        {/* 숫자 */}
        <span
          className="font-bold text-amber-900 select-none"
          style={{
            fontSize: cellSize * 0.45,
            textShadow: "0 1px 2px rgba(255,255,255,0.5)",
            marginTop: cellSize * 0.1,
          }}
        >
          {cell.value}
        </span>
      </div>
    </motion.div>
  );
}
