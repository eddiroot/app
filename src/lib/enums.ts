export enum yearLevelEnum {
	none = 'N',
	foundation = 'F',
	year1 = '1',
	year2 = '2',
	year3 = '3',
	year4 = '4',
	year5 = '5',
	year6 = '6',
	year7 = '7',
	year8 = '8',
	year9 = '9',
	year10 = '10',
	year11 = '11',
	year12 = '12'
}

// ============================================================================
// SCHOOL & SPACE
// ============================================================================

export enum schoolSpaceTypeEnum {
	classroom = 'classroom',
	laboratory = 'laboratory',
	gymnasium = 'gymnasium',
	pool = 'pool',
	library = 'library',
	auditorium = 'auditorium'
}

export enum subjectClassAllocationAttendanceStatus {
	present = 'present',
	absent = 'absent'
}

export enum subjectClassAllocationAttendanceComponentType {
	present = 'present',
	absent = 'absent',
	classPass = 'class_pass'
}

export enum subjectThreadTypeEnum {
	discussion = 'discussion',
	question = 'question',
	announcement = 'announcement',
	qanda = 'qanda'
}

export enum subjectThreadResponseTypeEnum {
	comment = 'comment',
	answer = 'answer'
}

export enum taskTypeEnum {
	lesson = 'lesson',
	homework = 'homework',
	test = 'test',
	assignment = 'assignment'
}

export enum taskBlockTypeEnum {
	heading = 'heading',
	richText = 'rich_text',
	mathInput = 'math_input',
	image = 'image',
	video = 'video',
	audio = 'audio',
	fillBlank = 'fill_blank',
	choice = 'choice',
	whiteboard = 'whiteboard',
	matching = 'matching',
	shortAnswer = 'short_answer',
	close = 'close',
	highlightText = 'highlight_text',
	table = 'table',
	graph = 'graph',
	balancingEquations = 'balancing_equations'
}

export enum taskStatusEnum {
	draft = 'draft',
	inProgress = 'in_progress',
	completed = 'completed',
	published = 'published',
	locked = 'locked',
	graded = 'graded'
}

export enum quizModeEnum {
	none = 'none', // Regular task
	scheduled = 'scheduled', // Quiz starts at specific time
	manual = 'manual' // Teacher manually starts quiz (which just updates the start time to current time)
}

export enum gradeReleaseEnum {
	instant = 'instant', // Grades released immediately after submission
	manual = 'manual', // Teacher manually releases grades
	scheduled = 'scheduled' // Grades released at specific time
}

export enum whiteboardObjectTypeEnum {
	rect = 'Rect',
	circle = 'Circle',
	path = 'Path',
	textbox = 'Textbox',
	image = 'Image'
}

export enum userTypeEnum {
	none = 'N',
	student = 'student',
	teacher = 'teacher',
	guardian = 'guardian',
	principal = 'principal',
	schoolAdmin = 'schoolAdmin'
}

export enum userHonorificEnum {
	mr = 'Mr',
	ms = 'Ms',
	mrs = 'Mrs',
	dr = 'Dr',
	prof = 'Prof'
}

export enum userGenderEnum {
	male = 'male',
	female = 'female',
	nonBinary = 'non-binary',
	other = 'other',
	unspecified = 'unspecified'
}

export enum relationshipTypeEnum {
	mother = 'mother',
	father = 'father',
	guardian = 'guardian'
}

export enum queueStatusEnum {
	queued = 'queued',
	inProgress = 'in_progress',
	completed = 'completed',
	failed = 'failed'
}

export enum constraintTypeEnum {
	time = 'time',
	space = 'space'
}

export enum newsPriorityEnum {
	low = 'low',
	normal = 'normal',
	high = 'high',
	urgent = 'urgent'
}

export enum newsStatusEnum {
	draft = 'draft',
	scheduled = 'scheduled',
	published = 'published',
	archived = 'archived'
}

export enum newsVisibilityEnum {
	public = 'public',
	internal = 'internal',
	staff = 'staff',
	students = 'students'
}

export enum subjectGroupEnum {
	mathematics = 'mathematics',
	science = 'science',
	english = 'english'
}

export enum collectionTypeEnum {
	private = 'private',
	public = 'public',
	shared = 'shared'
}

export enum difficultyLevelEnum {
	easy = 'easy',
	medium = 'medium',
	hard = 'hard'
}

export enum contentTypeEnum {
	resource = 'resource',
	questionBank = 'question_bank',
	scaffold = 'scaffold',
	activities = 'activities',
	rubricCriteria = 'rubric_criteria',
	feedback = 'feedback',
	guidance = 'guidance',
	misconception = 'misconception',
	studentArtifact = 'student_artifact',
	tempWorkspace = 'temp_workspace'
}

export enum rubricLevelEnum {
	exemplary = 'exemplary',
	accomplished = 'accomplished',
	developing = 'developing',
	beginning = 'beginning'
}

export enum VCAAF10SubjectEnum {
	english = 'english',
	mathematics = 'mathematics',
	science = 'science',
	history = 'history',
	geography = 'geography',
	economics_and_business = 'economics_and_business',
	civics_and_citizenship = 'civics_and_citizenship',
	health_and_physical_education = 'health_and_physical_education',
	design_and_technologies = 'design_and_technologies',
	dance = 'dance',
	drama = 'drama',
	media_arts = 'media_arts',
	music = 'music',
	visual_arts = 'visual_arts',
	visual_communication_design = 'visual_communication_design',
	digital_technologies = 'digital_technologies'
}

export enum VCAAVCESubjectEnum {
	dance = 'dance',
	drama = 'drama',
	music = 'music',
	theatre_studies = 'theatre_studies',
	art_creative_practice = 'art_creative_practice',
	art_making_and_exhibiting = 'art_making_and_exhibiting',
	media = 'media',
	visual_communication_design = 'visual_communication_design',
	agricultural_and_horticultural_studies = 'agricultural_and_horticultural_studies',
	food_studies = 'food_studies',
	product_design_and_technology = 'product_design_and_technology',
	systems_engineering = 'systems_engineering',
	foundation_mathematics = 'foundation_mathematics',
	general_mathematics = 'general_mathematics',
	mathematical_methods = 'mathematical_methods',
	specialist_mathematics = 'specialist_mathematics',
	english_as_an_additional_language = 'english_as_an_additional_language',
	english = 'english',
	english_language = 'english_language',
	literature = 'literature',
	biology = 'biology',
	chemistry = 'chemistry',
	physics = 'physics',
	psychology = 'psychology',
	environmental_science = 'environmental_science',
	accounting = 'accounting',
	business_management = 'business_management',
	economics = 'economics',
	industry_and_enterprise = 'industry_and_enterprise',
	legal_studies = 'legal_studies',
	geography = 'geography',
	history = 'history',
	philosophy = 'philosophy',
	politics = 'politics',
	religion_and_society = 'religion_and_society',
	sociology = 'sociology',
	texts_and_traditions = 'texts_and_traditions',
	health_and_human_development = 'health_and_human_development',
	physical_education = 'physical_education',
	outdoor_and_environmental_studies = 'outdoor_and_environmental_studies',
	algorithmics = 'algorithmics',
	applied_computing = 'applied_computing'
}

export enum curriculumSubjectExtraContentTypeEnum {
	rubric = 'rubric',
	description = 'description',
	detailedExample = 'detailed_example'
}

export enum gradeScaleEnum {
	IB_DP = 'IB_DP',
	IB_MYP = 'IB_MYP',
	IB_PYP = 'IB_PYP',
	IB_CP = 'IB_CP',
	GPA = 'GPA',
	percentage = 'percentage',
	custom = 'custom'
}
