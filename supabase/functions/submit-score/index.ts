import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 게임 상수
const GRID_COLS = 10;
const GRID_ROWS = 18;
const GAME_TIME = 90;
const MAX_STEPS = 500; // steps 배열 최대 크기

// UUID 형식 검증
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

// Seeded Random (mulberry32 알고리즘)
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded 보드 생성
function generateBoardFromSeed(
  masterSeed: number,
  resetIndex: number
): number[][] {
  const combinedSeed = masterSeed + resetIndex * 1000000;
  const random = mulberry32(combinedSeed);

  const board: number[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const rowValues: number[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      rowValues.push(Math.floor(random() * 9) + 1);
    }
    board.push(rowValues);
  }
  return board;
}

// 특정 영역의 합 계산
function calculateBoxSum(
  board: number[][],
  popped: boolean[][],
  startCol: number,
  endCol: number,
  startRow: number,
  endRow: number
): { sum: number; count: number; cells: [number, number][] } {
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);

  let sum = 0;
  let count = 0;
  const cells: [number, number][] = [];

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!popped[row][col]) {
        sum += board[row][col];
        count++;
        cells.push([row, col]);
      }
    }
  }

  return { sum, count, cells };
}

// Step 타입
interface PopStep {
  type: "pop";
  box: [number, number, number, number]; // [startCol, endCol, startRow, endRow]
  resetIndex: number;
  time: number;
}

interface ResetStep {
  type: "reset";
  resetIndex: number;
  time: number;
}

type GameStep = PopStep | ResetStep;

// 요청 페이로드
interface SubmitPayload {
  session_id: string;
  nickname: string;
  steps: GameStep[];
  claimed_score: number;
  clear_time: number | null;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // POST 메서드만 허용
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 요청 파싱
    let payload: SubmitPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id, nickname, steps, claimed_score, clear_time } = payload;

    // 필수 필드 검증
    if (!session_id || !nickname || !steps) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // session_id UUID 형식 검증
    if (typeof session_id !== "string" || !isValidUUID(session_id)) {
      return new Response(JSON.stringify({ error: "Invalid session ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 닉네임 검증 (최대 20자, 공백만 불가)
    if (
      typeof nickname !== "string" ||
      nickname.length > 20 ||
      nickname.trim().length === 0
    ) {
      return new Response(JSON.stringify({ error: "Invalid nickname" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // steps 배열 검증
    if (!Array.isArray(steps)) {
      return new Response(JSON.stringify({ error: "Invalid steps format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // steps 크기 제한
    if (steps.length > MAX_STEPS) {
      return new Response(JSON.stringify({ error: "Too many steps" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // claimed_score 검증
    if (typeof claimed_score !== "number" || claimed_score < 0 || claimed_score > 500) {
      return new Response(JSON.stringify({ error: "Invalid score" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // clear_time 검증
    if (clear_time !== null) {
      if (typeof clear_time !== "number" || clear_time < 0 || clear_time > GAME_TIME) {
        return new Response(JSON.stringify({ error: "Invalid clear time" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 만료 확인
    if (new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 이미 사용된 세션인지 확인
    if (session.used_at) {
      return new Response(JSON.stringify({ error: "Session already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 리플레이 검증
    const masterSeed = Number(session.master_seed);
    let currentResetIndex = 0;
    let board = generateBoardFromSeed(masterSeed, currentResetIndex);
    let popped: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
      Array(GRID_COLS).fill(false)
    );
    let calculatedScore = 0;
    let lastTime = 0;

    for (const step of steps) {
      // step 타입 검증
      if (!step || typeof step !== "object" || !("type" in step)) {
        return new Response(JSON.stringify({ error: "Invalid step format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 시간 검증
      if (typeof step.time !== "number" || step.time < 0) {
        return new Response(JSON.stringify({ error: "Invalid step time" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 시간 검증 (순차적이어야 함)
      if (step.time < lastTime) {
        return new Response(
          JSON.stringify({ error: "Invalid step timing" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      lastTime = step.time;

      // 90초 초과 검증
      if (step.time > GAME_TIME * 1000) {
        return new Response(
          JSON.stringify({ error: "Step exceeds time limit" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (step.type === "reset") {
        // resetIndex 타입 검증
        if (typeof step.resetIndex !== "number") {
          return new Response(
            JSON.stringify({ error: "Invalid reset index type" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // 리셋 검증: resetIndex가 순차적인지
        if (step.resetIndex !== currentResetIndex + 1) {
          return new Response(
            JSON.stringify({ error: "Invalid reset index" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        currentResetIndex = step.resetIndex;
        board = generateBoardFromSeed(masterSeed, currentResetIndex);
        popped = Array.from({ length: GRID_ROWS }, () =>
          Array(GRID_COLS).fill(false)
        );
      } else if (step.type === "pop") {
        // pop step 검증
        if (
          typeof step.resetIndex !== "number" ||
          !Array.isArray(step.box) ||
          step.box.length !== 4
        ) {
          return new Response(
            JSON.stringify({ error: "Invalid pop step format" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // pop 검증: resetIndex가 현재와 일치하는지
        if (step.resetIndex !== currentResetIndex) {
          return new Response(
            JSON.stringify({ error: "Reset index mismatch" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const [startCol, endCol, startRow, endRow] = step.box;

        // box 값들이 숫자인지 검증
        if (
          typeof startCol !== "number" ||
          typeof endCol !== "number" ||
          typeof startRow !== "number" ||
          typeof endRow !== "number"
        ) {
          return new Response(JSON.stringify({ error: "Invalid box values" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // 범위 검증
        if (
          startCol < 0 ||
          endCol >= GRID_COLS ||
          startRow < 0 ||
          endRow >= GRID_ROWS ||
          startCol > endCol ||
          startRow > endRow
        ) {
          return new Response(JSON.stringify({ error: "Invalid box range" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // 합계 검증
        const { sum, count, cells } = calculateBoxSum(
          board,
          popped,
          startCol,
          endCol,
          startRow,
          endRow
        );

        if (count === 0) {
          return new Response(
            JSON.stringify({ error: "No cells in selection" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (sum !== 10) {
          return new Response(
            JSON.stringify({
              error: "Sum is not 10",
              details: { sum, expected: 10 },
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // 셀 터뜨리기
        for (const [row, col] of cells) {
          popped[row][col] = true;
        }
        calculatedScore += count;
      } else {
        return new Response(JSON.stringify({ error: "Unknown step type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 점수 검증
    if (calculatedScore !== claimed_score) {
      return new Response(
        JSON.stringify({
          error: "Score mismatch",
          details: { calculated: calculatedScore, claimed: claimed_score },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 세션 사용 처리
    await supabase
      .from("game_sessions")
      .update({ used_at: new Date().toISOString() })
      .eq("id", session_id);

    // 기존 점수 조회
    const { data: existingScore } = await supabase
      .from("scores")
      .select("*")
      .eq("nickname", nickname.trim())
      .single();

    let result;
    let isNewRecord = false;
    let previousScore: number | null = null;

    if (existingScore) {
      previousScore = existingScore.score;
      // 새 점수가 더 높으면 업데이트
      if (calculatedScore > existingScore.score) {
        const { data, error } = await supabase
          .from("scores")
          .update({
            score: calculatedScore,
            clear_time: clear_time,
            updated_at: new Date().toISOString(),
          })
          .eq("nickname", nickname.trim())
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: "Failed to update score" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = data;
        isNewRecord = true;
      } else {
        result = existingScore;
      }
    } else {
      // 신규 기록
      const { data, error } = await supabase
        .from("scores")
        .insert({
          nickname: nickname.trim(),
          score: calculatedScore,
          clear_time: clear_time,
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to save score" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      result = data;
      isNewRecord = true;
    }

    // 순위 조회
    const { count: higherCount } = await supabase
      .from("scores")
      .select("*", { count: "exact", head: true })
      .gt("score", calculatedScore);

    const { count: totalCount } = await supabase
      .from("scores")
      .select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        success: true,
        score: result,
        isNewRecord,
        previousScore,
        rank: (higherCount || 0) + 1,
        totalPlayers: totalCount || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
