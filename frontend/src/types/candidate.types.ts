export type PipelineStage = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired';

export type Stage = PipelineStage | 'Rejected';

export interface StageEvent {
  id: number;
  from_stage: string | null;
  to_stage: string;
  occurred_at: string;
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  current_stage: Stage;
  created_at: string;
  current_stage_since?: string;
}

export interface CandidateDetail extends Candidate {
  current_stage_since: string;
  history: StageEvent[];
}

export interface CandidateCreateInput {
  name: string;
  email: string;
}

export interface StageTransitionInput {
  target_stage: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}
