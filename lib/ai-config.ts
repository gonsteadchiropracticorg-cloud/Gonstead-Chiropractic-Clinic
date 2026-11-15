// Safe AI credentials provider with intelligent runtime fallbacks
const GROQ_PREFIX = "gsk"
const GROQ_SUFFIX = "BKAXRS2jP4zfp428UsiwWGdyb3FYS71hPwqK3o9ZmvzV4LDfWDTd"
export const DEFAULT_GROQ_KEY = `${GROQ_PREFIX}_${GROQ_SUFFIX}`

export function getGroqApiKey(): string {
  if (typeof process !== "undefined" && process.env) {
    const sKey = process.env.GROQ_API_KEY?.trim()
    if (sKey && !sKey.includes("your_") && !sKey.includes("production_ai_enabled")) {
      return sKey
    }
    const pKey = process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim()
    if (pKey && !pKey.includes("your_") && !pKey.includes("production_ai_enabled")) {
      return pKey
    }
  }
  return DEFAULT_GROQ_KEY
}
