import { useState, useCallback, useRef, useEffect } from 'react';
import { GRID_COLS, GRID_ROWS } from '../utils/gameLogic';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseDragSelectProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSelectionChange: (startCol: number, endCol: number, startRow: number, endRow: number) => void;
  onSelectionEnd: () => void;
  enabled: boolean;
}

export function useDragSelect({
  containerRef,
  onSelectionChange,
  onSelectionEnd,
  enabled,
}: UseDragSelectProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const cellSizeRef = useRef({ width: 0, height: 0 });

  // 셀 크기 계산
  const updateCellSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      cellSizeRef.current = {
        width: rect.width / GRID_COLS,
        height: rect.height / GRID_ROWS,
      };
    }
  }, [containerRef]);

  // 좌표를 셀 인덱스로 변환
  const coordsToCell = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { col: 0, row: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / cellSizeRef.current.width)));
      const row = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / cellSizeRef.current.height)));

      return { col, row };
    },
    [containerRef]
  );

  // 드래그 시작
  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled) return;
      
      updateCellSize();
      
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      // 컨테이너 내부인지 체크
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      setDragState({
        isDragging: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });

      const { col, row } = coordsToCell(clientX, clientY);
      onSelectionChange(col, col, row, row);
    },
    [enabled, updateCellSize, containerRef, coordsToCell, onSelectionChange]
  );

  // 드래그 중
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragState.isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      setDragState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));

      const startCell = coordsToCell(
        rect.left + dragState.startX,
        rect.top + dragState.startY
      );
      const endCell = coordsToCell(clientX, clientY);

      onSelectionChange(startCell.col, endCell.col, startCell.row, endCell.row);
    },
    [dragState, containerRef, coordsToCell, onSelectionChange]
  );

  // 드래그 종료
  const handleEnd = useCallback(() => {
    if (dragState.isDragging) {
      onSelectionEnd();
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    }
  }, [dragState.isDragging, onSelectionEnd]);

  // 마우스 이벤트
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    const container = containerRef.current;
    if (container && enabled) {
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, enabled, handleStart, handleMove, handleEnd]);

  // 터치 이벤트
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    const container = containerRef.current;
    if (container && enabled) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [containerRef, enabled, handleStart, handleMove, handleEnd]);

  // 드래그 박스 좌표 계산
  const dragBox = dragState.isDragging
    ? {
        left: Math.min(dragState.startX, dragState.currentX),
        top: Math.min(dragState.startY, dragState.currentY),
        width: Math.abs(dragState.currentX - dragState.startX),
        height: Math.abs(dragState.currentY - dragState.startY),
      }
    : null;

  return { dragBox, isDragging: dragState.isDragging };
}

