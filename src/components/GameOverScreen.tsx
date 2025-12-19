import { shareToKakao } from "../utils/kakaoShare";

interface GameOverScreenProps {
  score: number;
  maxScore: number;
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
          </div>

          {/* 기록 갱신 알림 */}
          {isNewRecord && previousScore !== null && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-center">
              <span className="text-amber-600 text-sm font-medium">
                🎊 새 기록! 이전 점수 {previousScore}점에서{" "}
                {score - previousScore}점 상승!
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
            {isLoading ? (
              <div className="flex-1 bg-neutral-50 rounded-2xl p-5 text-center border border-neutral-100">
                <div className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-1">
                  Rank
                </div>
                <div className="flex flex-col items-center gap-1.5 mt-2">
                  <div className="h-9 w-16 bg-neutral-200 rounded-lg animate-pulse" />
                  <div className="h-3 w-12 bg-neutral-200 rounded animate-pulse" />
                </div>
              </div>
            ) : myRank !== null ? (
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
            ) : null}
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="w-full max-w-sm mx-auto space-y-3 mb-10">
        {/* 카카오톡 공유 버튼 */}
        <button
          onClick={() => shareToKakao(score, myRank)}
          className="w-full py-3 rounded-xl font-medium text-black text-sm
              bg-[#FEE500] hover:bg-[#FDD800] active:scale-[0.98]
              transition-all flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.093 5.903-.17.616-.63 2.235-.72 2.582-.11.43.157.424.331.308.137-.09 2.18-1.48 3.063-2.08.406.054.823.082 1.233.082 5.523 0 10-3.477 10-7.795C20 6.477 17.523 3 12 3z" />
          </svg>
          카카오톡으로 공유하기
        </button>

        <div className="flex flex-row gap-3 w-full">
          <button
            onClick={onHome}
            className="w-full py-3 rounded-xl font-medium text-neutral-800 text-sm
                bg-neutral-200 hover:bg-neutral-300 active:scale-[0.98]
                transition-all"
          >
            처음으로
          </button>
          <button
            onClick={onShowLeaderboard}
            className="w-full py-3 rounded-xl font-medium text-neutral-800 text-sm
                bg-neutral-200 hover:bg-neutral-300 active:scale-[0.98]
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
