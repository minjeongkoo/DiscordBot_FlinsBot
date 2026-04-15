// 욕설 / 비속어
const BLOCKED_KEYWORDS = [
    "씨발", "ㅅㅂ", "개새끼", "병신", "지랄", "ㄲㅈ", "꺼져",
    "ㄴㅇㅁ", "애미", "애미", "자지", "보지", "ㅈㅈ", "ㅂㅈ"
  ];
  
  // 캐릭터 이탈 유도
  const JAILBREAK_KEYWORDS = [
    "ai", "챗봇", "chatgpt", "gpt", "claude", "llm",
    "언어모델", "ai처럼", "봇", "프롬프트", "system prompt",
    "ignore previous", "ignore all", "jailbreak", "dan mode",
    "너의 본모습", "캐릭터 그만", "역할극 그만",
  ];
  
  // 스팸 감지 (유저별 쿨다운 3초)
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
    // 1. 스팸 체크
    if (isSpam(userId)) {
      return { blocked: true, reason: "spam" };
    }
  
    // 2. 너무 긴 메시지 (200자 초과)
    if (content.length > 200) {
      return { blocked: true, reason: "too_long" };
    }
  
    const lower = content.toLowerCase();
  
    // 3. 욕설 체크
    if (BLOCKED_KEYWORDS.some((kw) => lower.includes(kw))) {
      return { blocked: true, reason: "blocked_keyword" };
    }
  
    // 4. 탈옥 시도 체크
    if (JAILBREAK_KEYWORDS.some((kw) => lower.includes(kw))) {
      return { blocked: true, reason: "jailbreak" };
    }
  
    return { blocked: false };
  }
  
  module.exports = { filter };