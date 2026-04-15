const axios = require("axios");

const OLLAMA_URL = process.env.OLLAMA_URL;
const MODEL = process.env.OLLAMA_MODEL;

async function generate(prompt) {
    try {
        const { data } = await axios.post(
            OLLAMA_URL,
            {
                model: MODEL,
                prompt,
                stream: false,
                options: {
                    temperature: 0.8,
                    top_p: 0.9,
                    num_predict: 200,
                },
            },
            { timeout: 60_000 }
        );

        return data.response?.trim() ?? "...";
    } catch (err) {
        if (err.code === "ECONNREFUSED") {
            return "[디스코드 봇 에러] 삶과 죽음의 경계로군요";
        }
        console.error("[Ollama Error]", err.message);
        return "[디스코드 봇 에러] 눈보라처럼 돌아오겠습니다";
    }
}

module.exports = { generate };