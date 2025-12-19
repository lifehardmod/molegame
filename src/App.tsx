import { useState, useCallback, useEffect } from "react";
import { useGame } from "./hooks/useGame";
import { GameBoard } from "./components/GameBoard";
import { GameHUD } from "./components/GameHUD";
import { StartScreen } from "./components/StartScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { Leaderboard } from "./components/Leaderboard";
import { submitScore, getTopScores } from "./utils/supabase";
import type { Score } from "./types/game";
import { Analytics } from "@vercel/analytics/react";

type Screen = "start" | "game" | "gameover" | "leaderboard";

function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [nickname, setNickname] = useState("");
  const [topScores, setTopScores] = useState<Score[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);

  const {
    gameState,
    cells,
    score,
    timeLeft,
    selectedCells,
    maxScore,
    isStarting,
    countdown,
    startGame,
    selectCells,
    clearSelection,
    tryPop,
    getGameData,
  } = useGame();

  const handleStart = useCallback(
    async (name: string) => {
      setNickname(name);
      setIsNewRecord(false);
      setPreviousScore(null);
      await startGame();
      setScreen("game");
    },
    [startGame]
  );

  useEffect(() => {
    if (gameState === "gameover" && screen === "game") {
      const handleGameOver = async () => {
        setScreen("gameover");
        setIsLoading(true);

        try {
          const gameData = getGameData();

          if (gameData.sessionId) {
            // Edge Function을 통해 검증 후 점수 저장
            const result = await submitScore(
              gameData.sessionId,
              nickname,
              gameData.steps,
              gameData.score
            );

            setIsNewRecord(result.isNewRecord);
            setPreviousScore(result.previousScore);
            setMyRank(result.rank);
            setTotalPlayers(result.totalPlayers);
          }

          const scores = await getTopScores(10);
          setTopScores(scores);
        } catch (error) {
          console.error("Error handling game over:", error);
        } finally {
          setIsLoading(false);
        }
      };
      handleGameOver();
    }
  }, [gameState, screen, nickname, getGameData]);

  const handleRestart = useCallback(async () => {
    setIsNewRecord(false);
    setPreviousScore(null);
    await startGame();
    setScreen("game");
  }, [startGame]);

  const handleShowLeaderboard = async () => {
    setScreen("leaderboard");
    setIsLoading(true);
    try {
      const scores = await getTopScores(50);
      setTopScores(scores);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionEnd = useCallback(() => {
    tryPop();
    clearSelection();
  }, [tryPop, clearSelection]);

  return (
    <div className="min-h-screen flex justify-center bg-neutral-100">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-2xl flex flex-col">
        {screen === "start" && (
          <StartScreen
            onStart={handleStart}
            onShowLeaderboard={handleShowLeaderboard}
            initialNickname={nickname}
            isLoading={isStarting}
          />
        )}

        {screen === "game" && (
          <div className="flex-1 flex flex-col py-2 overflow-hidden bg-neutral-50 relative">
            <div className="shrink-0">
              <GameHUD
                score={score}
                maxScore={maxScore}
                timeLeft={timeLeft}
                selectedCount={selectedCells.length}
                onHome={() => setScreen("start")}
                onRestart={handleRestart}
              />
            </div>
            <div className="flex-1 min-h-0">
              <GameBoard
                cells={cells}
                selectedCells={selectedCells}
                onSelectionChange={selectCells}
                onSelectionEnd={handleSelectionEnd}
                enabled={gameState === "playing"}
              />
            </div>

            {/* 카운트다운 오버레이 */}
            {gameState === "countdown" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                <div
                  key={countdown}
                  className="countdown-number text-[140px] font-bold text-white drop-shadow-lg"
                  style={{
                    fontFamily: "'Jua', sans-serif",
                    textShadow:
                      "0 0 40px rgba(251, 191, 36, 0.8), 0 0 80px rgba(251, 191, 36, 0.4)",
                  }}
                >
                  {countdown}
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "gameover" && (
          <GameOverScreen
            score={score}
            maxScore={maxScore}
            myRank={myRank}
            totalPlayers={totalPlayers}
            onHome={() => setScreen("start")}
            onRestart={handleRestart}
            onShowLeaderboard={handleShowLeaderboard}
            isLoading={isLoading}
            isNewRecord={isNewRecord}
            previousScore={previousScore}
          />
        )}

        {screen === "leaderboard" && (
          <Leaderboard
            scores={topScores}
            isLoading={isLoading}
            onClose={() =>
              setScreen(gameState === "gameover" ? "gameover" : "start")
            }
          />
        )}
      </div>
      <Analytics />
    </div>
  );
}

export default App;
