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
	year10A = '10A',
	year11 = '11',
	year12 = '12',
	year13 = '13',
	VCE = 'VCE'
}

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
	assignment = 'assignment',
	module = 'module'
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
	schoolAdmin = 'schoolAdmin',
	systemAdmin = 'systemAdmin'
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
