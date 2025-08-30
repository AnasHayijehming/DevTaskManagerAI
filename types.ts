
export enum Status {
  Todo = 'Todo',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum TestCaseStatus {
  Pending = 'Pending',
  Pass = 'Pass',
  Fail = 'Fail',
}

export interface TestCase {
  id: string;
  description: string;
  input: string;
  expectedResult: string;
  status: TestCaseStatus;
}

export interface PreDevAnalysis {
  introduction: string;
  impactAnalysis: string;
  howToCode: string;
  testApproach: string;
}

export interface RequirementChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface KnowledgeFile {
  id: number;
  name: string;
  content: string;
  createdAt: Date;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface DevTaskCardData {
  title: string;
  status: Status;
  requirement: string;
  referenceLink: string;
  spec: string;
  preDevAnalysis: PreDevAnalysis;
  testCases: TestCase[];
  requirementChatHistory: RequirementChatMessage[];
  knowledgeFileIds: number[];
  tagIds: number[];
  createdAt: Date;
  updatedAt: Date;
}


export interface DevTaskCard extends DevTaskCardData {
  id: number;
}
