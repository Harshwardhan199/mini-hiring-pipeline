import { candidateApi } from '../api/candidate.api.ts';
import type {
  Candidate,
  CandidateCreateInput,
  CandidateDetail,
  PipelineStage,
  Stage,
} from '../types/candidate.types.ts';
import type { SearchResponse } from '../types/search.types.ts';

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
] as const;

export const NEXT_STAGE_MAP: Record<string, Stage> = {
  Applied: 'Screening',
  Screening: 'Interview',
  Interview: 'Offer',
  Offer: 'Hired',
};

export const TERMINAL_STAGES: ReadonlySet<Stage> = new Set(['Hired', 'Rejected']);

export class CandidateService {
  /**
   * Retrieve list of candidates
   */
  async getCandidates(): Promise<Candidate[]> {
    return candidateApi.getAll();
  }

  /**
   * Retrieve single candidate full history
   */
  async getCandidateById(id: number): Promise<CandidateDetail> {
    return candidateApi.getById(id);
  }

  /**
   * Create candidate in Applied stage
   */
  async createCandidate(data: CandidateCreateInput): Promise<Candidate> {
    const trimmedData = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
    };
    return candidateApi.create(trimmedData);
  }

  /**
   * Advance candidate to the next sequential stage
   */
  async advanceStage(id: number, targetStage: Stage): Promise<Candidate> {
    return candidateApi.transition(id, { target_stage: targetStage });
  }

  /**
   * Reject a candidate
   */
  async rejectCandidate(id: number): Promise<Candidate> {
    return candidateApi.reject(id);
  }

  /**
   * Returns the next stage in pipeline or null if terminal
   */
  getNextStage(currentStage: Stage): Stage | null {
    return NEXT_STAGE_MAP[currentStage] || null;
  }

  /**
   * Checks if candidate can be transitioned forward
   */
  canAdvance(currentStage: Stage): boolean {
    return !TERMINAL_STAGES.has(currentStage) && !!NEXT_STAGE_MAP[currentStage];
  }

  /**
   * Checks if candidate can be rejected
   */
  canReject(currentStage: Stage): boolean {
    return !TERMINAL_STAGES.has(currentStage);
  }

  /**
   * Natural language search — delegates to POST /search
   */
  async searchCandidates(query: string): Promise<SearchResponse> {
    return candidateApi.search({ query });
  }
}

export const candidateService = new CandidateService();
