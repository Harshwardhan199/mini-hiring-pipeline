from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.search.parser import parse_search_query
from app.search.schemas import SearchRequest, SearchResponse
from app.search.service import search_candidates


router = APIRouter(
    prefix="/search",
    tags=["Search"],
)


@router.post("", response_model=SearchResponse)
def search(
    data: SearchRequest,
    db: Session = Depends(get_db),
):
    try:
        search_query = parse_search_query(data.query)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to interpret search query: {exc}",
        ) from exc

    if search_query.query_type == "invalid":
        return SearchResponse(
            query=data.query,
            interpreted_query=search_query,
            results=[],
            total=0,
        )

    results = search_candidates(
        db,
        search_query,
    )

    return SearchResponse(
        query=data.query,
        interpreted_query=search_query,
        results=results,
        total=len(results),
    )