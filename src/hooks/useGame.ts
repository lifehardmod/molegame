import { useState, useCallback, useEffect, useRef } from "react";
import type { Cell, GameState, GameStep, GameSession } from "../types/game";
import {
  generateBoard,
  getCellsInBox,
  calculateSum,
  hasValidCombination,
  GAME_TIME,
  TOTAL_CELLS,
} from "../utils/gameLogic";
import { startGameSession } from "../utils/supabase";

export function useGame() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [cells, setCells] = useState<Cell[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // 세션 정보
  const sessionRef = useRef<GameSession | null>(null);
  const stepsRef = useRef<GameStep[]>([]);
  const resetIndexRef = useRef<number>(0);

  // 게임 시작
  const startGame = useCallback(async () => {
    setIsStarting(true);

    try {
      // 서버에서 세션 생성
      const session = await startGameSession();

      if (!session) {
        console.error("Failed to create game session");
        setIsStarting(false);
        return;
      }

      // 세션 정보 저장
      sessionRef.current = session;
      stepsRef.current = [];
      resetIndexRef.current = 0;

      // seeded random으로 보드 생성
      setCells(generateBoard(session.masterSeed, 0));
      setScore(0);
      setTimeLeft(GAME_TIME);
      setSelectedCells([]);
      
      // 카운트다운 시작
      setCountdown(3);
      setGameState("countdown");
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setIsStarting(false);
    }
  }, []);

  // 게임판 리셋 (진행 중) - 수동 리셋은 steps에 기록하지 않음
  const resetBoard = useCallback(() => {
    if (!sessionRef.current) return;

    resetIndexRef.current += 1;

    // 리셋 step 기록
    const elapsed = Date.now() - startTimeRef.current;
    stepsRef.current.push({
      type: "reset",
      resetIndex: resetIndexRef.current,
      time: elapsed,
    });

    setCells(generateBoard(sessionRef.current.masterSeed, resetIndexRef.current));
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

  // 현재 선택 영역 계산 (step 기록용)
  const getSelectionBox = useCallback((): [number, number, number, number] | null => {
    if (selectedCells.length === 0) return null;

    const cols = selectedCells.map((c) => c.col);
    const rows = selectedCells.map((c) => c.row);

    return [
      Math.min(...cols),
      Math.max(...cols),
      Math.min(...rows),
      Math.max(...rows),
    ];
  }, [selectedCells]);

  // 터뜨리기 시도
  const tryPop = useCallback(() => {
    const sum = calculateSum(selectedCells);

    if (sum === 10 && selectedCells.length > 0) {
      // step 기록
      const box = getSelectionBox();
      if (box) {
        const elapsed = Date.now() - startTimeRef.current;
        stepsRef.current.push({
          type: "pop",
          box,
          resetIndex: resetIndexRef.current,
          time: elapsed,
        });
      }

      // 터뜨리기 성공
      const poppedIds = new Set(selectedCells.map((c) => c.id));
      const newCells = cells.map((cell) =>
        poppedIds.has(cell.id) ? { ...cell, isPopped: true } : cell
      );

      setCells(newCells);
      setScore((prev) => prev + selectedCells.length);
      setSelectedCells([]);

      // 조합 가능 여부 체크 (약간의 딜레이 후)
      setTimeout(() => {
        if (!hasValidCombination(newCells)) {
          // 자동 리셋
          if (!sessionRef.current) return;

          resetIndexRef.current += 1;

          // 리셋 step 기록
          const elapsed = Date.now() - startTimeRef.current;
          stepsRef.current.push({
            type: "reset",
            resetIndex: resetIndexRef.current,
            time: elapsed,
          });

          setCells(
            generateBoard(sessionRef.current.masterSeed, resetIndexRef.current)
          );
        }
      }, 300);

      return true;
    }

    setSelectedCells([]);
    return false;
  }, [selectedCells, cells, getSelectionBox]);

  // 카운트다운 타이머 (시작 시 한 번만 설정)
  useEffect(() => {
    if (gameState !== "countdown") return;

    // 카운트다운 시작: 3 -> 2 -> 1 -> 시작
    const timers: number[] = [];
    
    timers.push(window.setTimeout(() => setCountdown(2), 1000));
    timers.push(window.setTimeout(() => setCountdown(1), 2000));
    timers.push(window.setTimeout(() => {
      setCountdown(0);
      setGameState("playing");
      startTimeRef.current = Date.now();
    }, 3000));

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [gameState]);

  // 게임 타이머
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

  // 현재 게임 데이터 가져오기 (점수 제출용)
  const getGameData = useCallback(() => {
    return {
      sessionId: sessionRef.current?.sessionId || null,
      steps: [...stepsRef.current],
      score,
    };
  }, [score]);

  return {
    gameState,
    cells,
    score,
    timeLeft,
    selectedCells,
    maxScore: TOTAL_CELLS,
    isStarting,
    countdown,
    startGame,
    resetBoard,
    selectCells,
    clearSelection,
    tryPop,
    getGameData,
  };
}
