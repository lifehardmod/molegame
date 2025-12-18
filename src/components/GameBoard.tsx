import { useRef, useState, useEffect } from "react";
import type { Cell } from "../types/game";
import { FishBread } from "./FishBread";
import { useDragSelect } from "../hooks/useDragSelect";
import { GRID_COLS, GRID_ROWS } from "../utils/gameLogic";

interface GameBoardProps {
  cells: Cell[];
  selectedCells: Cell[];
  onSelectionChange: (
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number
  ) => void;
  onSelectionEnd: () => void;
  enabled: boolean;
}

export function GameBoard({
  cells,
  selectedCells,
  onSelectionChange,
  onSelectionEnd,
  enabled,
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(0);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  const { dragBox, isDragging } = useDragSelect({
    containerRef,
    onSelectionChange,
    onSelectionEnd,
    enabled,
  });

  useEffect(() => {
    const updateSize = () => {
      if (wrapperRef.current) {
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const availableWidth = wrapperRect.width - 16;
        const availableHeight = wrapperRect.height;

        const boardRatio = GRID_COLS / GRID_ROWS;
        const containerRatio = availableWidth / availableHeight;

        let boardWidth: number;
        let boardHeight: number;

        if (containerRatio > boardRatio) {
          boardHeight = availableHeight;
          boardWidth = boardHeight * boardRatio;
        } else {
          boardWidth = availableWidth;
          boardHeight = boardWidth / boardRatio;
        }

        setBoardSize({ width: boardWidth, height: boardHeight });
        setCellSize(boardWidth / GRID_COLS);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const selectedIds = new Set(selectedCells.map((c) => c.id));

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full flex items-center justify-center px-2"
    >
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: boardSize.width,
          height: boardSize.height,
          background: "linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)",
          boxShadow: "inset 0 2px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* 격자 배경 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: `${100 / GRID_COLS}% ${100 / GRID_ROWS}%`,
          }}
        />

        {/* 붕어빵들 */}
        {cells.map((cell) => (
          <FishBread
            key={cell.id}
            cell={cell}
            isSelected={selectedIds.has(cell.id)}
            cellSize={cellSize}
          />
        ))}

        {/* 드래그 박스 */}
        {isDragging && dragBox && (
          <div
            className="absolute border-2 border-neutral-400 bg-neutral-500/10 rounded-lg pointer-events-none"
            style={{
              left: dragBox.left,
              top: dragBox.top,
              width: dragBox.width,
              height: dragBox.height,
            }}
          />
        )}
      </div>
    </div>
  );
}
