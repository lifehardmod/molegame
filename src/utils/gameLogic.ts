import type { Cell } from "../types/game";

export const GRID_COLS = 10;
export const GRID_ROWS = 15;
export const TOTAL_CELLS = GRID_COLS * GRID_ROWS; // 180
export const GAME_TIME = 90; // 90초

// 게임판 생성 (1~9 랜덤)
export function generateBoard(): Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      cells.push({
        id: `${row}-${col}`,
        row,
        col,
        value: Math.floor(Math.random() * 9) + 1, // 1~9
        isPopped: false,
      });
    }
  }
  return cells;
}

// 특정 영역 내 셀들 가져오기
export function getCellsInBox(
  cells: Cell[],
  startCol: number,
  endCol: number,
  startRow: number,
  endRow: number
): Cell[] {
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);

  return cells.filter(
    (cell) =>
      !cell.isPopped &&
      cell.col >= minCol &&
      cell.col <= maxCol &&
      cell.row >= minRow &&
      cell.row <= maxRow
  );
}

// 셀들의 합계 계산
export function calculateSum(cells: Cell[]): number {
  return cells.reduce((sum, cell) => sum + cell.value, 0);
}

// 10을 만들 수 있는 조합이 있는지 체크
export function hasValidCombination(cells: Cell[]): boolean {
  const activeCells = cells.filter((c) => !c.isPopped);

  if (activeCells.length === 0) return false;

  // 모든 가능한 사각형 영역 검사
  for (let startRow = 0; startRow < GRID_ROWS; startRow++) {
    for (let startCol = 0; startCol < GRID_COLS; startCol++) {
      for (let endRow = startRow; endRow < GRID_ROWS; endRow++) {
        for (let endCol = startCol; endCol < GRID_COLS; endCol++) {
          const boxCells = getCellsInBox(
            cells,
            startCol,
            endCol,
            startRow,
            endRow
          );
          if (boxCells.length > 0 && calculateSum(boxCells) === 10) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// 남은 셀 수 계산
export function getRemainingCount(cells: Cell[]): number {
  return cells.filter((c) => !c.isPopped).length;
}

// 시간 포맷 (초 -> MM:SS)
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
