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
	year12 = '12',
}

export enum userPermissions {
	viewTasks = 'view_tasks',
	createTasks = 'create_tasks',
	viewAnalytics = 'view_analytics',
	manageTeachers = 'manage_teachers',
	viewChildGrades = 'view_child_grades',
	viewDashboard = 'view_dashboard',
	viewAdmin = 'view_admin',
	viewCalendar = 'view_calendar',
	viewClassAttendance = 'view_class_attendance',
	viewGuardianAttendance = 'view_guardian_attendance',
	viewNews = 'view_news',
	createNews = 'create_news',
	archiveNews = 'archive_news',
	viewCourseMap = 'view_course_map',
}

export enum schoolSpaceTypeEnum {
	classroom = 'classroom',
	laboratory = 'laboratory',
	gymnasium = 'gymnasium',
	pool = 'pool',
	library = 'library',
	auditorium = 'auditorium',
}

export enum subjectClassAllocationAttendanceStatus {
	present = 'present',
	absent = 'absent',
}

export enum subjectClassAllocationAttendanceComponentType {
	present = 'present',
	absent = 'absent',
	classPass = 'class_pass',
}

export enum subjectThreadTypeEnum {
	discussion = 'discussion',
	question = 'question',
	announcement = 'announcement',
	qanda = 'qanda',
}

export enum subjectThreadResponseTypeEnum {
	comment = 'comment',
	answer = 'answer',
}

export enum taskTypeEnum {
	lesson = 'lesson',
	homework = 'homework',
	test = 'test',
	assignment = 'assignment',
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
	balancingEquations = 'balancing_equations',
	submission = 'submission',
}

export enum taskStatusEnum {
	draft = 'draft',
	inProgress = 'in_progress',
	completed = 'completed',
	published = 'published',
	locked = 'locked',
	graded = 'graded',
}

export enum quizModeEnum {
	none = 'none', // Regular task
	scheduled = 'scheduled', // Quiz starts at specific time
	manual = 'manual', // Teacher manually starts quiz (which just updates the start time to current time)
}

export enum gradeReleaseEnum {
	instant = 'instant', // Grades released immediately after submission
	scheduled = 'scheduled', // Grades released at specific time
	manual = 'manual', // Teacher manually releases grades
}

export enum userTypeEnum {
	none = 'N',
	student = 'student',
	guardian = 'guardian',
	teacher = 'teacher',
	staff = 'staff',
	principal = 'principal',
	admin = 'admin',
}

export enum userHonorificEnum {
	mr = 'Mr',
	ms = 'Ms',
	mrs = 'Mrs',
	dr = 'Dr',
	prof = 'Prof',
}

export enum userGenderEnum {
	male = 'male',
	female = 'female',
	nonBinary = 'non-binary',
	other = 'other',
	unspecified = 'unspecified',
}

export enum relationshipTypeEnum {
	mother = 'mother',
	father = 'father',
	grandmother = 'grandmother',
	grandfather = 'grandfather',
	aunt = 'aunt',
	uncle = 'uncle',
	sister = 'sister',
	brother = 'brother',
	guardian = 'guardian',
}

export enum queueStatusEnum {
	queued = 'queued',
	inProgress = 'in_progress',
	completed = 'completed',
	failed = 'failed',
}

export enum constraintTypeEnum {
	time = 'time',
	space = 'space',
}

export enum newsPriorityEnum {
	low = 'low',
	normal = 'normal',
	high = 'high',
	urgent = 'urgent',
}

export enum newsStatusEnum {
	draft = 'draft',
	scheduled = 'scheduled',
	published = 'published',
}

export enum newsVisibilityEnum {
	public = 'public',
	internal = 'internal',
	staff = 'staff',
	students = 'students',
}

export enum rubricLevelEnum {
	exemplary = 'exemplary',
	accomplished = 'accomplished',
	developing = 'developing',
	beginning = 'beginning',
}

export enum gradeScaleEnum {
	IB_DP = 'IB_DP',
	IB_MYP = 'IB_MYP',
	IB_PYP = 'IB_PYP',
	IB_CP = 'IB_CP',
	GPA = 'GPA',
	percentage = 'percentage',
}

export enum eventTypeEnum {
	school = 'school',
	campus = 'campus',
	subject = 'subject',
	class = 'class',
}
