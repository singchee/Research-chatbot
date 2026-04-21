export type StepNumber = 1 | 2 | 3 | 4;
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  stepContext?: StepNumber;
}

export interface SummaryBlock {
  step: StepNumber;
  content: string;
  confirmedAt?: Date;
}

export interface ResearchSession {
  currentStep: StepNumber;
  messages: Message[];
  summaryBlocks: SummaryBlock[];
  studyAcronym?: string;
  piName: string;
  sessionStarted: Date;
}

export interface GeneratedFile {
  filename: string;
  type: 'docx' | 'xlsx';
  blob: Blob;
  note?: string;
}

export interface StepTransition {
  id: string;
  from: StepNumber;
  to: StepNumber;
  afterMessageId: string;
}

export interface Step4Details {
  studyAcronym: string;
  sites: string[];
  enrolment: number | '';
  coInvestigators: string;
}
