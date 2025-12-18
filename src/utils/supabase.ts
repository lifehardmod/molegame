import { createClient } from "@supabase/supabase-js";
import type { Score } from "../types/game";

// Supabase 설정 (환경 변수 또는 기본값)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Supabase 클라이언트 생성 (설정이 없으면 null)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// 점수 저장 결과 타입
export interface SaveScoreResult {
  score: Score | null;
  isNewRecord: boolean; // 기록 갱신 여부
  previousScore: number | null; // 이전 점수
}

// 점수 저장 (같은 닉네임이면 높은 점수로 업데이트)
export async function saveScore(
  nickname: string,
  score: number,
  clearTime: number | null
): Promise<SaveScoreResult> {
  if (!supabase) {
    console.log("Supabase not configured, score not saved");
    return { score: null, isNewRecord: false, previousScore: null };
  }

  // 기존 닉네임 기록 조회
  const { data: existingData } = await supabase
    .from("scores")
    .select("*")
    .eq("nickname", nickname)
    .single();

  // 기존 기록이 있는 경우
  if (existingData) {
    const previousScore = existingData.score;

    // 새 점수가 더 높으면 업데이트
    if (score > existingData.score) {
      const { data, error } = await supabase
        .from("scores")
        .update({
          score,
          clear_time: clearTime,
          updated_at: new Date().toISOString(),
        })
        .eq("nickname", nickname)
        .select()
        .single();

      if (error) {
        console.error("Error updating score:", error);
        return { score: null, isNewRecord: false, previousScore };
      }

      return { score: data, isNewRecord: true, previousScore };
    }

    // 점수가 같거나 낮으면 기존 기록 유지
    return { score: existingData, isNewRecord: false, previousScore };
  }

  // 신규 기록 생성
  const { data, error } = await supabase
    .from("scores")
    .insert([
      {
        nickname,
        score,
        clear_time: clearTime,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error saving score:", error);
    return { score: null, isNewRecord: false, previousScore: null };
  }

  return { score: data, isNewRecord: true, previousScore: null };
}

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
    .order("clear_time", { ascending: true, nullsFirst: false })
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
