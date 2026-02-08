export type FETOutput = {
	'?xml': string
	fet: {
		Activities_List: {
			Activity: {
				Id: number
				Teacher: string
				Subject: number
				Students: number
				Duration: number
				Total_Duration: number
			}[]
		}
		Time_Constraints_List: {
			ConstraintActivityPreferredStartingTime: {
				Activity_Id: number
				Day: number
				Hour: number
			}[]
		}
		Space_Constraints_List: {
			ConstraintActivityPreferredRoom: { Activity_Id: number; Room: number }[]
		}
	}
}

export type FETActivity = {
	Teacher: string
	Subject: number
	Students: number
	Room: number
	Day: number
	Period: number
	Duration: number
}

// Base constraint type that all FET constraints extend
export type BaseConstraint = {
	Weight_Percentage: number
	Active: boolean
	Comments?: string
}

// Time Constraints
export type ConstraintBasicCompulsoryTime = BaseConstraint

export type ConstraintStudentsMaxGapsPerWeek = BaseConstraint & {
	Max_Gaps: number
}

export type ConstraintMinDaysBetweenActivities = BaseConstraint & {
	Consecutive_If_Same_Day: boolean
	MinDays: number
	Number_of_Activities: number
	Activity_Id: number[]
}

export type ConstraintTeacherNotAvailableTimes = BaseConstraint & {
	Teacher: string
	Number_of_Not_Available_Times: number
	Not_Available_Time: { Day: string; Hour: number }[]
}

export type ConstraintTeacherMaxDaysPerWeek = BaseConstraint & {
	Teacher_Name: string
	Max_Days_Per_Week: number
}

export type ConstraintTeachersMaxGapsPerWeek = BaseConstraint & {
	Max_Gaps: number
}

export type ConstraintActivityPreferredStartingTime = BaseConstraint & {
	Activity_Id: number
	Preferred_Day: string
	Preferred_Hour: number
	Permanently_Locked?: boolean
}

// Space Constraints
export type ConstraintBasicCompulsorySpace = BaseConstraint

export type ConstraintRoomNotAvailableTimes = BaseConstraint & {
	Room: string
	Number_of_Not_Available_Times: number
	Not_Available_Time: { Day: string; Hour: number }[]
}

export type ConstraintSubjectPreferredRoom = BaseConstraint & {
	Subject: string
	Room: string
}

export type ConstraintSubjectPreferredRooms = BaseConstraint & {
	Subject: string
	Number_of_Preferred_Rooms: number
	Preferred_Room: string[]
}
