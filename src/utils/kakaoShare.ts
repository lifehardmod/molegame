// Kakao SDK 타입 선언
declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

interface KakaoShareOptions {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: {
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }[];
}

// 카카오 앱 키 (환경 변수에서 가져오기)
const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY || "";
const SITE_URL = "https://duduji.site";

// 카카오 SDK 초기화
export function initKakao(): boolean {
  if (!KAKAO_APP_KEY) {
    console.warn("Kakao App Key not configured");
    return false;
  }

  if (typeof window !== "undefined" && window.Kakao) {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_APP_KEY);
      console.log("Kakao SDK initialized");
    }
    return window.Kakao.isInitialized();
  }
  return false;
}

// 카카오톡 공유하기
export function shareToKakao(score: number, rank: number | null): void {
  // SDK 존재 확인
  if (typeof window === "undefined" || !window.Kakao) {
    console.warn("Kakao SDK not loaded");
    shareViaNavigator(score, rank);
    return;
  }

  // 초기화 안 되어있으면 초기화
  if (!window.Kakao.isInitialized()) {
    if (!KAKAO_APP_KEY) {
      console.warn("Kakao App Key not configured");
      shareViaNavigator(score, rank);
      return;
    }
    window.Kakao.init(KAKAO_APP_KEY);
  }

  // 다시 확인
  if (!window.Kakao.isInitialized()) {
    console.warn("Kakao SDK initialization failed");
    shareViaNavigator(score, rank);
    return;
  }

  const description = rank
    ? `🎮 ${score}점으로 전체 ${rank}등을 기록했어요! 도전해보세요!`
    : `🎮 ${score}점을 기록했어요! 도전해보세요!`;

  try {
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "🎮 두더지 게임 - 합이 10이 되도록!",
        description: description,
        imageUrl: `${SITE_URL}/Logo.webp`,
        link: {
          mobileWebUrl: SITE_URL,
          webUrl: SITE_URL,
        },
      },
      buttons: [
        {
          title: "나도 도전하기",
          link: {
            mobileWebUrl: SITE_URL,
            webUrl: SITE_URL,
          },
        },
      ],
    });
  } catch (error) {
    console.error("Kakao share error:", error);
    shareViaNavigator(score, rank);
  }
}

// Web Share API 또는 클립보드 복사로 대체
export async function shareViaNavigator(
  score: number,
  rank: number | null
): Promise<boolean> {
  const text = rank
    ? `🎮 두더지 게임에서 ${score}점으로 전체 ${rank}등을 기록했어요! 도전해보세요!`
    : `🎮 두더지 게임에서 ${score}점을 기록했어요! 도전해보세요!`;

  const shareData = {
    title: "두더지 게임",
    text: text,
    url: SITE_URL,
  };

  // Web Share API 지원 확인
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share error:", error);
      }
      return false;
    }
  }

  // 클립보드에 복사
  try {
    await navigator.clipboard.writeText(`${text}\n${SITE_URL}`);
    alert("링크가 복사되었습니다!");
    return true;
  } catch (error) {
    console.error("Clipboard error:", error);
    return false;
  }
}
