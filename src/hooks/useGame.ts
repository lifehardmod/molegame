import { useState, useCallback, useEffect, useRef } from "react";
import type { Cell, GameState } from "../types/game";
import {
  generateBoard,
  getCellsInBox,
  calculateSum,
  hasValidCombination,
  getRemainingCount,
  GAME_TIME,
  TOTAL_CELLS,
} from "../utils/gameLogic";

export function useGame() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [cells, setCells] = useState<Cell[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [clearTime, setClearTime] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // 게임 시작
  const startGame = useCallback(() => {
    setCells(generateBoard());
    setScore(0);
    setTimeLeft(GAME_TIME);
    setSelectedCells([]);
    setClearTime(null);
    setGameState("playing");
    startTimeRef.current = Date.now();
  }, []);

  // 게임판 리셋 (진행 중)
  const resetBoard = useCallback(() => {
    setCells(generateBoard());
    setSelectedCells([]);
  }, []);

  // 셀 선택 (드래그 영역)
  const selectCells = useCallback(
    (startCol: number, endCol: number, startRow: number, endRow: number) => {
      const selected = getCellsInBox(cells, startCol, endCol, startRow, endRow);
      setSelectedCells(selected);
    },
    [cells]
  );

  // 선택 해제
  const clearSelection = useCallback(() => {
    setSelectedCells([]);
  }, []);

  // 터뜨리기 시도
  const tryPop = useCallback(() => {
    const sum = calculateSum(selectedCells);

    if (sum === 10 && selectedCells.length > 0) {
      // 터뜨리기 성공
      const poppedIds = new Set(selectedCells.map((c) => c.id));
      const newCells = cells.map((cell) =>
        poppedIds.has(cell.id) ? { ...cell, isPopped: true } : cell
      );

      setCells(newCells);
      setScore((prev) => prev + selectedCells.length);
      setSelectedCells([]);

      // 전부 클리어 체크
      const remaining = getRemainingCount(newCells);
      if (remaining === 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setClearTime(elapsed);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setGameState("gameover");
        return true;
      }

      // 조합 가능 여부 체크 (약간의 딜레이 후)
      setTimeout(() => {
        if (!hasValidCombination(newCells)) {
          // 자동 리셋
          setCells(generateBoard());
        }
      }, 300);

      return true;
    }

    setSelectedCells([]);
    return false;
  }, [selectedCells, cells]);

  // 타이머
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setGameState("gameover");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  return {
    gameState,
    cells,
    score,
    timeLeft,
    selectedCells,
    clearTime,
    maxScore: TOTAL_CELLS,
    startGame,
    resetBoard,
    selectCells,
    clearSelection,
    tryPop,
  };
}
