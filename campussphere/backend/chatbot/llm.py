"""Optional LLM layer. The assistant works WITHOUT any key (database-backed answers).
To enable AI phrasing later, set in backend/.env:
    AI_PROVIDER=anthropic   (or openai)
    AI_API_KEY=your-key
    AI_MODEL=optional-model-name
The LLM only rewrites facts retrieved from the database, so answers stay grounded."""
import os

import requests

SYSTEM = ("You are CampusSphere AI Assistant for a college department. Answer ONLY using the department data "
          "provided. Be concise, friendly and accurate. If the data does not contain the answer, say you do not "
          "have that information and suggest contacting the department office. Plain text only.")


def enabled():
    return os.getenv("AI_PROVIDER", "none").lower() in ("anthropic", "openai") and bool(os.getenv("AI_API_KEY"))


def enhance(question, facts):
    """Return an LLM-phrased answer, or None to fall back to the rule-based answer."""
    if not enabled():
        return None
    provider, key, model = os.getenv("AI_PROVIDER").lower(), os.getenv("AI_API_KEY"), os.getenv("AI_MODEL", "")
    prompt = f"Question: {question}\n\nDepartment data:\n{facts}"
    try:
        if provider == "anthropic":
            r = requests.post("https://api.anthropic.com/v1/messages", timeout=20,
                              headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                              json={"model": model or "claude-haiku-4-5-20251001", "max_tokens": 400, "system": SYSTEM,
                                    "messages": [{"role": "user", "content": prompt}]})
            r.raise_for_status()
            return r.json()["content"][0]["text"].strip()
        r = requests.post("https://api.openai.com/v1/chat/completions", timeout=20,
                          headers={"Authorization": f"Bearer {key}"},
                          json={"model": model or "gpt-4o-mini", "max_tokens": 400,
                                "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}]})
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return None
