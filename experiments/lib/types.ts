export type ExperimentStatus = "supported" | "rejected" | "inconclusive";

export interface ExperimentDefinition<TParameters, TResult> {
  id: string;
  title: string;
  hypothesis: string;
  modelVersion: string;
  seed: number | null;
  playerPolicy: string;
  horizon: string;
  stoppingCondition: string;
  parameters: TParameters;
  run(): ExperimentResult<TResult>;
}

export interface ExperimentResult<TResult> {
  id: string;
  status: ExperimentStatus;
  modelVersion: string;
  deterministic: true;
  result: TResult;
  findings: string[];
  risks: string[];
  limitations: string[];
  artifacts: string[];
}

