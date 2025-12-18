import { useState } from "react";
import { formatTime, GAME_TIME } from "../utils/gameLogic";

interface GameHUDProps {
  score: number;
  maxScore: number;
  timeLeft: number;
  selectedCount: number;
  onHome: () => void;
  onRestart: () => void;
}

export function GameHUD({
  score,
  maxScore,
  timeLeft,
  onHome,
  onRestart,
}: GameHUDProps) {
  const [showRestartModal, setShowRestartModal] = useState(false);
  const timePercent = (timeLeft / GAME_TIME) * 100;
  const isLowTime = timeLeft <= 30;

  const handleRestartClick = () => {
    setShowRestartModal(true);
  };

  const handleConfirmRestart = () => {
    setShowRestartModal(false);
    onRestart();
  };

  return (
    <>
      <div className="w-full px-3 py-2">
        <div className="flex items-stretch gap-2 h-[72px]">
          {/* 점수 */}
          <div className="flex-1 bg-white rounded-xl px-4 py-2 shadow-sm border border-neutral-100 flex flex-col justify-center">
            <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">
              Score
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-neutral-900">
                {score}
              </span>
              <span className="text-xs text-neutral-400">/ {maxScore}</span>
            </div>
          </div>

          {/* 타이머 */}
          <div className="flex-1 bg-white rounded-xl px-4 py-2 shadow-sm border border-neutral-100 flex flex-col justify-center">
            <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">
              Time
            </div>
            <div
              className={`text-2xl font-bold ${
                isLowTime ? "text-red-500" : "text-neutral-900"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="mt-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isLowTime ? "bg-red-500" : "bg-amber-400"
                }`}
                style={{ width: `${timePercent}%` }}
              />
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex flex-col gap-1">
            <button
              onClick={onHome}
              className="flex-1 bg-white rounded-lg px-3 shadow-sm border border-neutral-100 
                text-neutral-500 text-xs font-medium hover:bg-neutral-50 active:scale-95 transition-all"
            >
              홈
            </button>
            <button
              onClick={handleRestartClick}
              className="flex-1 bg-white rounded-lg px-3 shadow-sm border border-neutral-100 
                text-neutral-500 text-xs font-medium hover:bg-neutral-50 active:scale-95 transition-all"
            >
              재시작
            </button>
          </div>
        </div>
      </div>

      {/* 다시하기 확인 모달 */}
      {showRestartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-xs w-full shadow-2xl">
            <h3 className="text-lg font-bold text-neutral-900 mb-1 text-center">
              다시 시작할까요?
            </h3>
            <p className="text-sm text-neutral-500 mb-5 text-center">
              현재 진행이 초기화됩니다
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmRestart}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-white font-medium 
                  hover:bg-neutral-800 active:scale-95 transition-all"
              >
                확인
              </button>
              <button
                onClick={() => setShowRestartModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium 
                  hover:bg-neutral-50 active:scale-95 transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
