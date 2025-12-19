export interface Cell {
  id: string;
  row: number;
  col: number;
  value: number;
  isPopped: boolean;
}

export interface DragBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface SelectedCells {
  cells: Cell[];
  sum: number;
}

export type GameState = "start" | "playing" | "gameover";

export interface Score {
  id: string;
  nickname: string;
  score: number;
  clear_time: number | null;
  created_at: string;
}

// 게임 스텝 타입 (리플레이 검증용)
export type GameStep =
  | {
      type: "pop";
      box: [number, number, number, number]; // [startCol, endCol, startRow, endRow]
      resetIndex: number;
      time: number;
    }
  | {
      type: "reset";
      resetIndex: number;
      time: number;
    };

// 게임 세션 정보
export interface GameSession {
  sessionId: string;
  masterSeed: number;
}
