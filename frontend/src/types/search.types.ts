export type CandidateStage =
    | "Applied"
    | "Screening"
    | "Interview"
    | "Offer"
    | "Hired"
    | "Rejected";


export interface SearchRequest {
    query: string;
}


export interface SearchQuery {
    query_type: "candidate_search" | "invalid";
    name: string | null;
    current_stage: CandidateStage | null;
    stage_duration_operator: "gt" | "gte" | "lt" | "lte" | "eq" | null;
    stage_duration_days: number | null;
    moved_to_stage: CandidateStage | null;
    moved_since: string | null;
    reached_stage: CandidateStage | null;
    not_reached_stage: CandidateStage | null;
    exclude_rejected: boolean;
    explanation: string | null;
}


export interface SearchCandidate {
    id: number;
    name: string;
    email: string;
    current_stage: CandidateStage;
    created_at: string;
    current_stage_since: string | null;
    current_stage_duration_days: number | null;
    match_score: number;
}


export interface SearchResponse {
    query: string;
    interpreted_query: SearchQuery;
    results: SearchCandidate[];
    total: number;
}