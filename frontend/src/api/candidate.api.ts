import { apiClient } from './client.ts';
import type {
  Candidate,
  CandidateCreateInput,
  CandidateDetail,
  StageTransitionInput,
} from '../types/candidate.types.ts';
import type { SearchRequest, SearchResponse } from '../types/search.types.ts';

export const candidateApi = {
  /**
   * Fetch all candidates
   * GET /candidates
   */
  async getAll(): Promise<Candidate[]> {
    return apiClient.get<Candidate[]>('/candidates');
  },

  /**
   * Fetch single candidate with stage history
   * GET /candidates/{candidate_id}
   */
  async getById(id: number): Promise<CandidateDetail> {
    return apiClient.get<CandidateDetail>(`/candidates/${id}`);
  },

  /**
   * Create a new candidate in Applied stage
   * POST /candidates
   */
  async create(data: CandidateCreateInput): Promise<Candidate> {
    return apiClient.post<Candidate, CandidateCreateInput>('/candidates', data);
  },

  /**
   * Transition candidate to target stage
   * POST /candidates/{candidate_id}/transition
   */
  async transition(id: number, data: StageTransitionInput): Promise<Candidate> {
    return apiClient.post<Candidate, StageTransitionInput>(`/candidates/${id}/transition`, data);
  },

  /**
   * Move candidate to Rejected terminal stage
   * POST /candidates/{candidate_id}/reject
   */
  async reject(id: number): Promise<Candidate> {
    return apiClient.post<Candidate>(`/candidates/${id}/reject`);
  },

  /**
   * Natural language search across candidates
   * POST /search
   */
  async search(data: SearchRequest): Promise<SearchResponse> {
    return apiClient.post<SearchResponse, SearchRequest>('/search', data);
  },
};
