import { formatTime } from "../utils/gameLogic";

interface GameOverScreenProps {
  score: number;
  maxScore: number;
  clearTime: number | null;
  myRank: number | null;
  totalPlayers: number;
  onRestart: () => void;
  onHome: () => void;
  onShowLeaderboard: () => void;
  isLoading: boolean;
  isNewRecord: boolean;
  previousScore: number | null;
}

export function GameOverScreen({
  score,
  maxScore,
  clearTime,
  myRank,
  totalPlayers,
  onRestart,
  onHome,
  onShowLeaderboard,
  isLoading,
  isNewRecord,
  previousScore,
}: GameOverScreenProps) {
  const isPerfect = score === maxScore;

  return (
    <div className="flex-1 flex flex-col p-6 bg-white">
      {/* 상단 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{isPerfect ? "🎉" : "⏱️"}</div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {isPerfect ? "퍼펙트!" : "게임 종료"}
            </h2>
            {clearTime && (
              <p className="text-neutral-500 text-sm mt-1">
                클리어 시간: {formatTime(clearTime)}
              </p>
            )}
          </div>

          {/* 기록 갱신 알림 */}
          {isNewRecord && previousScore !== null && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-center">
              <span className="text-amber-600 text-sm font-medium">
                🎊 새 기록! 이전 점수 {previousScore}점에서 {score - previousScore}점 상승!
              </span>
            </div>
          )}
          {isNewRecord && previousScore === null && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-center">
              <span className="text-green-600 text-sm font-medium">
                🎊 첫 기록이 등록되었습니다!
              </span>
            </div>
          )}

          <div className="flex flex-row gap-3 w-full mb-4">
            {/* 점수 카드 */}
            <div className="flex-1 bg-neutral-50 rounded-2xl p-5 text-center border border-neutral-100">
              <div className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-1">
                Score
              </div>
              <div className="text-4xl font-bold text-neutral-900">{score}</div>
            </div>

            {/* 순위 */}
            {!isLoading && myRank !== null && (
              <div className="flex-1 bg-neutral-50 rounded-2xl p-5 text-center border border-neutral-100">
                <div className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-1">
                  Rank
                </div>
                <div className="text-4xl font-bold text-neutral-900">
                  {myRank}
                  <span className="text-sm font-normal text-neutral-400 ml-1">
                    / {totalPlayers}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="w-full max-w-sm mx-auto space-y-3 mb-10">
        <div className="flex flex-row gap-3 w-full">
          <button
            onClick={onHome}
            className="w-full py-3 rounded-xl font-medium text-neutral-800 text-sm
                bg-neutral-200 hover:bg-neutral-200 active:scale-[0.98]
                transition-all"
          >
            처음으로
          </button>
          <button
            onClick={onShowLeaderboard}
            className="w-full py-3 rounded-xl font-medium text-neutral-800 text-sm
                bg-neutral-200 hover:bg-neutral-200 active:scale-[0.98]
                transition-all"
          >
            🏆 랭킹 보기
          </button>
        </div>
        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-xl font-semibold text-white text-sm
                bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98]
                transition-all shadow-lg shadow-neutral-900/20"
        >
          다시 하기
        </button>
      </div>
    </div>
  );
}
