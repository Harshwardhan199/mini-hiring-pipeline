from datetime import datetime, timezone

from pydantic import ValidationError

from app.llm.client import llm_client
from app.llm.prompts import SEARCH_SYSTEM_PROMPT, build_search_prompt
from app.search.schemas import SearchQuery


def parse_search_query(query: str) -> SearchQuery:
    current_date = datetime.now(timezone.utc).date().isoformat()

    raw_result = llm_client.generate_json(
        system_prompt=SEARCH_SYSTEM_PROMPT,
        user_prompt=build_search_prompt(
            query=query,
            current_date=current_date,
        ),
    )

    try:
        return SearchQuery.model_validate(raw_result)
    except ValidationError as exc:
        raise ValueError(
            f"LLM returned an invalid search query: {exc}"
        ) from exc