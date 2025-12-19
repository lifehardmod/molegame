import { createClient } from "@supabase/supabase-js";
import type { Score, GameStep, GameSession } from "../types/game";

// Supabase 설정 (환경 변수 또는 기본값)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Edge Function URL
const edgeFunctionUrl = supabaseUrl
  ? `${supabaseUrl}/functions/v1`
  : "";

// Supabase 클라이언트 생성 (읽기 전용 작업에 사용)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ============================================
// Edge Function 호출 (보안 API)
// ============================================

// 게임 세션 시작
export async function startGameSession(): Promise<GameSession | null> {
  if (!edgeFunctionUrl || !supabaseAnonKey) {
    console.log("Supabase not configured");
    return null;
  }

  try {
    const response = await fetch(`${edgeFunctionUrl}/start-game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to start game:", error);
      return null;
    }

    const data = await response.json();
    return {
      sessionId: data.session_id,
      masterSeed: data.master_seed,
    };
  } catch (error) {
    console.error("Error starting game session:", error);
    return null;
  }
}

// 점수 저장 결과 타입
export interface SaveScoreResult {
  score: Score | null;
  isNewRecord: boolean;
  previousScore: number | null;
  rank: number | null;
  totalPlayers: number;
}

// 점수 제출 (Edge Function을 통해 검증 후 저장)
export async function submitScore(
  sessionId: string,
  nickname: string,
  steps: GameStep[],
  claimedScore: number
): Promise<SaveScoreResult> {
  if (!edgeFunctionUrl || !supabaseAnonKey) {
    console.log("Supabase not configured, score not saved");
    return {
      score: null,
      isNewRecord: false,
      previousScore: null,
      rank: null,
      totalPlayers: 0,
    };
  }

  try {
    const response = await fetch(`${edgeFunctionUrl}/submit-score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        nickname,
        steps,
        claimed_score: claimedScore,
        clear_time: null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to submit score:", data.error);
      return {
        score: null,
        isNewRecord: false,
        previousScore: null,
        rank: null,
        totalPlayers: 0,
      };
    }

    return {
      score: data.score,
      isNewRecord: data.isNewRecord,
      previousScore: data.previousScore,
      rank: data.rank,
      totalPlayers: data.totalPlayers,
    };
  } catch (error) {
    console.error("Error submitting score:", error);
    return {
      score: null,
      isNewRecord: false,
      previousScore: null,
      rank: null,
      totalPlayers: 0,
    };
  }
}

// ============================================
// 읽기 전용 API (기존 유지)
// ============================================

// Top N 점수 가져오기
export async function getTopScores(limit: number = 50): Promise<Score[]> {
  if (!supabase) {
    console.log("Supabase not configured");
    return [];
  }

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching scores:", error);
    return [];
  }

  return data || [];
}

// 특정 점수의 순위 가져오기
export async function getRank(
  score: number
): Promise<{ rank: number; total: number }> {
  if (!supabase) {
    return { rank: 0, total: 0 };
  }

  // 해당 점수보다 높은 점수 개수 조회
  const { count: higherCount, error: higherError } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .gt("score", score);

  // 전체 플레이어 수 조회
  const { count: totalCount, error: totalError } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true });

  if (higherError || totalError) {
    console.error("Error fetching rank:", higherError || totalError);
    return { rank: 0, total: 0 };
  }

  return {
    rank: (higherCount || 0) + 1,
    total: totalCount || 0,
  };
}

// 닉네임으로 검색
export async function searchByNickname(
  query: string,
  limit: number = 20
): Promise<Score[]> {
  if (!supabase || !query.trim()) {
    return [];
  }

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .ilike("nickname", `%${query}%`)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error searching scores:", error);
    return [];
  }

  return data || [];
}

// 특정 닉네임의 순위 가져오기
export async function getRankByNickname(
  nickname: string
): Promise<{ rank: number; score: Score | null }> {
  if (!supabase) {
    return { rank: 0, score: null };
  }

  // 해당 닉네임의 점수 조회
  const { data: userData } = await supabase
    .from("scores")
    .select("*")
    .eq("nickname", nickname)
    .single();

  if (!userData) {
    return { rank: 0, score: null };
  }

  // 해당 점수보다 높은 점수 개수 조회
  const { count: higherCount } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .gt("score", userData.score);

  return {
    rank: (higherCount || 0) + 1,
    score: userData,
  };
}
