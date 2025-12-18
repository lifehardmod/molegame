import { useState, useCallback, useEffect } from "react";
import { useGame } from "./hooks/useGame";
import { GameBoard } from "./components/GameBoard";
import { GameHUD } from "./components/GameHUD";
import { StartScreen } from "./components/StartScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { Leaderboard } from "./components/Leaderboard";
import { saveScore, getTopScores, getRank } from "./utils/supabase";
import type { Score } from "./types/game";

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
    clearTime,
    maxScore,
    startGame,
    selectCells,
    clearSelection,
    tryPop,
  } = useGame();

  const handleStart = useCallback(
    (name: string) => {
      setNickname(name);
      startGame();
      setScreen("game");
      setIsNewRecord(false);
      setPreviousScore(null);
    },
    [startGame]
  );

  useEffect(() => {
    if (gameState === "gameover" && screen === "game") {
      const handleGameOver = async () => {
        setScreen("gameover");
        setIsLoading(true);

        try {
          const saveResult = await saveScore(nickname, score, clearTime);
          setIsNewRecord(saveResult.isNewRecord);
          setPreviousScore(saveResult.previousScore);

          const [rankData, scores] = await Promise.all([
            getRank(score),
            getTopScores(10),
          ]);
          setMyRank(rankData.rank);
          setTotalPlayers(rankData.total);
          setTopScores(scores);
        } catch (error) {
          console.error("Error handling game over:", error);
        } finally {
          setIsLoading(false);
        }
      };
      handleGameOver();
    }
  }, [gameState, screen, nickname, score, clearTime]);

  const handleRestart = useCallback(() => {
    startGame();
    setScreen("game");
    setIsNewRecord(false);
    setPreviousScore(null);
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
          />
        )}

        {screen === "game" && (
          <div className="flex-1 flex flex-col py-2 overflow-hidden bg-neutral-50">
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
          </div>
        )}

        {screen === "gameover" && (
          <GameOverScreen
            score={score}
            maxScore={maxScore}
            clearTime={clearTime}
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
    </div>
  );
}

export default App;
