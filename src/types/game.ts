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
