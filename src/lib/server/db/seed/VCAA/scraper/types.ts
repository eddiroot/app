export interface VCAACurriculumData {
	scrapedAt: string;
	subjects: VCAASubject[];
}

export interface VCAASubject {
	name: string;
	url: string;
	learningAreas: VCAALearningArea[];
}

export interface VCAALearningArea {
	name: string;
	description: string;
	standards: VCAAStandard[];
}

export interface VCAAStandard {
	name: string;
	description: string;
	yearLevel: string;
	elaborations: string[];
}

// VCE Data Interfaces
export interface VCAAData {
	// Foundation Math nested structure
	curriculum?: {
		curriculumSubjects: Array<{
			name: string;
			learningAreas: Array<LearningAreaData>;
			outcomes: Array<OutcomeData>;
		}>;
	};
	
	// Direct structure (Biology, Legal Studies)
	id?: number;
	name?: string;
	learningAreas?: Array<LearningAreaData>;
	outcomes?: Array<OutcomeData>;
	keySkills?: Array<KeySkillData>;
	keyKnowledge?: Array<KeyKnowledgeData>;
}

export interface LearningAreaData {
	id?: number;
	name: string;
	abbreviation?: string;
	description?: string;
	contents?: Array<{ description: string; number?: number }>;
}

export interface OutcomeData {
	id?: number;
	number: number | string;
	description: string;
	abbreviation?: string;
	keySkills?: Array<KeySkillData>;
	keyKnowledge?: Array<KeyKnowledgeData>;
	topics?: Array<{ id?: number; name: string; outcomeTopic?: string; outcomeId?: number }>;
}

export interface KeySkillData {
	id?: number;
	number?: string | number;
	description?: string;
	topicName?: string;
	outcomeTopic?: string;
	outcomeTopicId?: number;
	name?: string;
}

export interface KeyKnowledgeData {
	id?: number;
	number?: string | number;
	description?: string;
	topicName?: string;
	outcomeTopic?: string;
	outcomeTopicId?: number;
	name?: string;
}
