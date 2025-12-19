import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: IP당 분당 최대 요청 수
const RATE_LIMIT_PER_MINUTE = 10;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (record.count >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }

  record.count++;
  return true;
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
    // Rate limiting 체크
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Supabase 클라이언트 (service_role 사용)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // master_seed 생성 (현재 시간 기반 + 랜덤)
    const masterSeed = Date.now() * 1000 + Math.floor(Math.random() * 1000);

    // 만료 시간 (3분 후)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    // 오래된 세션 정리 (24시간 이전)
    await supabase
      .from("game_sessions")
      .delete()
      .lt("expires_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // 세션 저장
    const { data, error } = await supabase
      .from("game_sessions")
      .insert({
        master_seed: masterSeed,
        expires_at: expiresAt,
      })
      .select("id, master_seed")
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create game session" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        session_id: data.id,
        master_seed: data.master_seed,
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
