/* eslint-disable @typescript-eslint/no-explicit-any */
export enum AgentType {
  TEACH_MODULE_GENERATOR = 'teach_module_generator',
  LEARNING_TUTOR = 'learning_tutor',
  ASSESSMENT_EVALUATOR = 'assessment_evaluator',
  HINT_PROVIDER = 'hint_provider',
  CONTENT_RETRIEVER = 'content_retriever',
  PROGRESS_TRACKER = 'progress_tracker',
  QUESTION_SELECTOR = 'question_selector'
}

export enum AgentAction {
  // Module Generation
  GENERATE_SCAFFOLD = 'generate_scaffold',
  GENERATE_CONTENT = 'generate_content',
  GENERATE_INTERACTIVE = 'generate_interactive',
  
  // Tutoring
  EVALUATE_RESPONSE = 'evaluate_response',
  PROVIDE_HINT = 'provide_hint',
  EXPLAIN_CONCEPT = 'explain_concept',
  SELECT_NEXT_QUESTION = 'select_next_question',
  
  // Feedback
  IMMEDIATE_FEEDBACK = 'immediate_feedback',
  DETAILED_FEEDBACK = 'detailed_feedback',
  MISCONCEPTION_ANALYSIS = 'misconception_analysis'
}

export interface AgentMemory {
  sessionId: string;
  userId: number; //uuid 
  moduleId?: number;
  context: {
    recentResponses: StudentResponse[];
    currentDifficulty: 'beginner' | 'intermediate' | 'advanced'; // difficulty level? where the student skill is up to. 
    strugglingConcepts: string[];
    masteredConcepts: string[];
    hintsUsed: number;
    attemptHistory: AttemptRecord[]; // history of attempts made by the student
  };
}

export interface StudentResponse {
  questionId: number;
  response: any; // create a zod for responses based on task blcoks 
  isCorrect: boolean;
  timestamp: Date;
  timeSpent: number;
  hintsUsed: number;
}

export interface AttemptRecord {
  blockId: number;
  attempts: number;
  finalScore: number;
  timeToComplete: number;
}

export interface AgentContext {
  userId?: number;
  sessionId?: string;
  moduleId?: number;
  metadata: {
    action: string;
    moduleParams?: any;
    previousResponse?: AgentResponse;
    [key: string]: any;
  };
  memory?: AgentMemory;
}

export interface AgentResponse {
  content: string;
  metadata: {
    stage: string;
    [key: string]: any;
  };
  sources?: any[];
  error?: string;
}

export interface AgentConfig {
  type: AgentType;
  systemInstruction: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract execute(context: AgentContext): Promise<AgentResponse>;

  protected getSystemInstruction(): string {
    return this.config.systemInstruction;
  }

  protected getType(): AgentType {
    return this.config.type;
  }

  protected getTemperature(): number {
    return this.config.temperature || 0.7;
  }

  protected getMaxTokens(): number {
    return this.config.maxTokens || 2000;
  }
}