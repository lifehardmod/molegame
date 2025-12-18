// 형용사 목록
const adjectives = [
  "배고픈", "졸린", "행복한", "신난", "용감한",
  "똑똑한", "귀여운", "멋진", "씩씩한", "느긋한",
  "재빠른", "든든한", "포근한", "달콤한", "바삭한",
  "따뜻한", "촉촉한", "황금빛", "반짝이는", "통통한",
  "수줍은", "당당한", "부지런한", "한가한", "배부른",
  "설레는", "기대하는", "도전하는", "빛나는", "웃는",
];

// 명사 목록
const nouns = [
  "붕어빵", "잉어빵", "국화빵", "호두과자", "계란빵",
  "타코야키", "붕세권", "붕어", "금붕어", "잉어",
  "단팥빵", "크림빵", "슈크림", "와플", "호떡",
  "팬케이크", "도넛", "마카롱", "쿠키", "머핀",
  "고등어", "연어", "참치", "새우", "문어",
];

// 랜덤 닉네임 생성
export function generateRandomNickname(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

