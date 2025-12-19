/**
 * Seeded Random Number Generator
 * mulberry32 알고리즘 사용 - 동일한 seed는 항상 동일한 난수 시퀀스 생성
 */

export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 주어진 seed로 특정 범위의 정수 생성
 */
export function seededRandomInt(
  random: () => number,
  min: number,
  max: number
): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
