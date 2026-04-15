/* 욕설 / 비속어 */
const BLOCKED_KEYWORDS = [
  "씨발", "ㅅㅂ", "개새끼", "병신", "지랄", "ㄲㅈ", "꺼져",
  "ㄴㅇㅁ", "애미", "섹스", "자지", "보지", "ㅈㅈ", "ㅂㅈ", "존나", "ㅈㄴ", "ㅆㅃ","ㅅㅅ"
];

/* 변형어 정규식 */
const BLOCKED_PATTERNS = [
  /ㅅ\s*ㅂ/,
  /ㅆ\s*ㅂ/,
  /씨\s*발/,
  /ㅅ\s*ㅣ\s*발/,
  /개\s*새\s*끼/,
  /ㄱ\s*ㅐ\s*ㅅ\s*ㄲ/,
  /병\s*신/,
  /ㅂ\s*ㅅ/,
  /지\s*랄/,
  /ㅈ\s*ㄹ/,
  /미\s*친/,
  /ㅁ\s*ㅊ/,
  /존\s*나/,
  /ㅈ\s*ㄴ/,
  /꺼\s*져/,
  /닥\s*쳐/,
  /f\s*u\s*c\s*k/i,
  /s\s*h\s*i\s*t/i,
  /ㅈ\s*ㅏ\s*지/,
  /자\s*ㅈ\s*ㅣ/,
  /ㅂ\s*ㅗ\s*지/,
  /보\s*ㅈ\s*ㅣ/,
  /ㅅ\s*ㅔ\s*ㄱ/,
  /섹\s*ㅅ\s*ㅡ/,
];

/* 캐릭터 이탈 유도 */
const JAILBREAK_KEYWORDS = [
  "ai", "챗봇", "chatgpt", "gpt", "claude", "llm",
  "언어모델", "ai처럼", "봇", "프롬프트", "system prompt",
  "ignore previous", "ignore all", "jailbreak", "dan mode",
  "너의 본모습", "캐릭터 그만", "역할극 그만",
];

/* 스팸 감지 (유저별 쿨다운 3초) */
const cooldowns = new Map();
const COOLDOWN_MS = 3000;

function isSpam(userId) {
  const now = Date.now();
  const last = cooldowns.get(userId) ?? 0;
  if (now - last < COOLDOWN_MS) return true;
  cooldowns.set(userId, now);
  return false;
}

function filter(userId, content) {
  /* 1. 스팸 체크 */
  if (isSpam(userId)) {
    return { blocked: true, reason: "spam" };
  }

  /* 2. 너무 긴 메시지 (200자 초과) */
  if (content.length > 200) {
    return { blocked: true, reason: "too_long" };
  }

  const lower = content.toLowerCase();

  /* 3. 욕설 키워드 체크 */
  if (BLOCKED_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { blocked: true, reason: "blocked_keyword" };
  }

  /* 4. 변형어 정규식 체크 */
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(content))) {
    return { blocked: true, reason: "blocked_keyword" };
  }

  /* 5. 탈옥 시도 체크 */
  if (JAILBREAK_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { blocked: true, reason: "jailbreak" };
  }

  return { blocked: false };
}

module.exports = { filter };