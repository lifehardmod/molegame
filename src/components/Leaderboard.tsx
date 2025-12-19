import { useState, useEffect } from "react";
import type { Score } from "../types/game";
import { searchByNickname, getRankByNickname } from "../utils/supabase";

interface LeaderboardProps {
  scores: Score[];
  isLoading: boolean;
  onClose: () => void;
}

export function Leaderboard({ scores, isLoading, onClose }: LeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Score[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedRank, setSearchedRank] = useState<number | null>(null);

  // 검색 디바운스
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchedRank(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchByNickname(searchQuery);
        setSearchResults(results);

        // 정확히 일치하는 닉네임이 있으면 순위도 가져오기
        const exactMatch = results.find(
          (r) => r.nickname.toLowerCase() === searchQuery.toLowerCase()
        );
        if (exactMatch) {
          const rankResult = await getRankByNickname(exactMatch.nickname);
          setSearchedRank(rankResult.rank);
        } else {
          setSearchedRank(null);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayScores = searchQuery.trim() ? searchResults : scores;
  const showLoading = isLoading || isSearching;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="text-center p-6 pb-0 mb-4">
        <h2 className="text-2xl font-bold text-neutral-900">🏆 랭킹</h2>
        <p className="text-sm text-neutral-400">
          {searchQuery.trim() ? "검색 결과" : "TOP 50"}
        </p>
      </div>

      {/* 검색 */}
      <div className="px-6 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="닉네임 검색..."
          className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50
            text-neutral-800 placeholder-neutral-400 text-sm
            focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
            transition-all"
        />
        {searchedRank !== null && (
          <p className="text-sm text-amber-600 mt-2 text-center">
            "{searchQuery}" 님의 순위: <strong>{searchedRank}등</strong>
          </p>
        )}
      </div>

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {showLoading ? (
          <div className="space-y-1.5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-6 bg-neutral-200 rounded animate-pulse" />
                  <div className="w-24 h-5 bg-neutral-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-5 bg-neutral-200 rounded animate-pulse" />
                  <div className="w-8 h-4 bg-neutral-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : displayScores.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            {searchQuery.trim() ? "검색 결과가 없어요" : "아직 기록이 없어요!"}
          </div>
        ) : (
          <div className="space-y-1.5">
            {displayScores.map((s, idx) => {
              // 검색 결과일 때는 전체 순위 대신 인덱스만 표시
              const isTopRanked = !searchQuery.trim() && idx < 3;
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    isTopRanked
                      ? "bg-amber-50 border border-amber-100"
                      : "bg-neutral-50 border border-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 text-center font-bold ${
                        !searchQuery.trim() && idx === 0
                          ? "text-amber-500 text-lg"
                          : !searchQuery.trim() && idx === 1
                          ? "text-neutral-400 text-lg"
                          : !searchQuery.trim() && idx === 2
                          ? "text-amber-700 text-lg"
                          : "text-neutral-400 text-sm"
                      }`}
                    >
                      {!searchQuery.trim() && idx === 0
                        ? "🥇"
                        : !searchQuery.trim() && idx === 1
                        ? "🥈"
                        : !searchQuery.trim() && idx === 2
                        ? "🥉"
                        : idx + 1}
                    </span>
                    <span className="text-neutral-700 truncate max-w-[140px]">
                      {s.nickname}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-neutral-900">
                      {s.score}
                    </span>
                    {s.clear_time && (
                      <span className="text-xs text-neutral-400 ml-1.5">
                        {Math.floor(s.clear_time / 60)}:
                        {String(s.clear_time % 60).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 닫기 버튼 - 화면 하단 고정 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 pt-4 bg-white border-t border-neutral-100">
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl font-semibold text-white text-sm
            bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98]
            transition-all shadow-lg shadow-neutral-900/20"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
