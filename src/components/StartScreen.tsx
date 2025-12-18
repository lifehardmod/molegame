import { useState } from "react";
import { generateRandomNickname } from "../utils/randomNickname";

interface StartScreenProps {
  onStart: (nickname: string) => void;
  onShowLeaderboard: () => void;
  initialNickname?: string;
}

export function StartScreen({
  onStart,
  onShowLeaderboard,
  initialNickname,
}: StartScreenProps) {
  const [nickname, setNickname] = useState(
    () => initialNickname || generateRandomNickname()
  );

  const handleStart = () => {
    const name = nickname.trim() || generateRandomNickname();
    onStart(name);
  };

  const handleRandomNickname = () => {
    setNickname(generateRandomNickname());
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-white">
      {/* 로고 */}
      <div className="mb-6 rounded-2xl overflow-hidden">
        <img src="/Logo.webp" alt="logo" className="w-full h-auto" />
      </div>
      {/* 게임 설명 */}
      <div className="text-center mb-18 space-y-1">
        <p className="text-neutral-700 text-sm">
          숫자의 합이 <span className="font-bold text-neutral-900">10</span>이
          되도록 드래그!
        </p>
        <p className="text-neutral-500 text-xs">
          제한시간 90초 내에 최대한 많이 터뜨리세요
        </p>
      </div>

      {/* 입력 폼 */}
      <div className="w-full max-w-xs space-y-3">
        <div>
          <label className="block text-neutral-500 text-xs font-medium mb-1.5 ml-1">
            닉네임을 직접 설정하시면 랭킹을 찾기 수월해요.
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50
                text-neutral-800 placeholder-neutral-400 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                transition-all"
            />
            <button
              onClick={handleRandomNickname}
              className="px-3 py-3 rounded-xl bg-amber-100 hover:bg-amber-200 
                active:scale-95 transition-all text-amber-700"
              title="랜덤 닉네임"
            >
              🎲
            </button>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl font-semibold text-white text-sm
            bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98]
            transition-all shadow-lg shadow-neutral-900/20"
        >
          게임 시작
        </button>

        <button
          onClick={onShowLeaderboard}
          className="w-full py-3 rounded-xl font-medium text-neutral-600 text-sm
            bg-neutral-100 hover:bg-neutral-200 active:scale-[0.98]
            transition-all"
        >
          🏆 랭킹 보기
        </button>
      </div>
    </div>
  );
}
