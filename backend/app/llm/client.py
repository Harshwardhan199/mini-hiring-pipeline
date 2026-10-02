import json

from groq import Groq

from app.config.settings import settings


class LLMClient:
    def __init__(self):
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured")

        if not settings.groq_model:
            raise RuntimeError("GROQ_MODEL is not configured")

        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model

    def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0,
            response_format={
                "type": "json_object",
            },
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("LLM returned an empty response")

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"LLM returned invalid JSON: {content}"
            ) from exc

        if not isinstance(parsed, dict):
            raise ValueError(
                f"LLM JSON response must be an object, got {type(parsed).__name__}"
            )

        return parsed


llm_client = LLMClient()