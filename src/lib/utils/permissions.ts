import { userPermissions, userTypeEnum } from '$lib/enums'

export function getPermissions(userType: userTypeEnum | undefined): string[] {
	if (!userType) {
		return []
	}
	switch (userType) {
		case userTypeEnum.student:
			return [
				userPermissions.viewTasks,
				userPermissions.viewDashboard,
				userPermissions.viewCalendar,
				userPermissions.viewNews,
			]
		case userTypeEnum.teacher:
			return [
				userPermissions.viewTasks,
				userPermissions.createTasks,
				userPermissions.viewAnalytics,
				userPermissions.viewCalendar,
				userPermissions.viewDashboard,
				userPermissions.viewClassAttendance,
				userPermissions.viewNews,
				userPermissions.createNews,
				userPermissions.archiveNews,
				userPermissions.viewCourseMap,
			]
		case userTypeEnum.guardian:
			return [
				userPermissions.viewChildGrades,
				userPermissions.viewTasks,
				userPermissions.viewCalendar,
				userPermissions.viewDashboard,
				userPermissions.viewGuardianAttendance,
				userPermissions.viewNews,
			]
		case userTypeEnum.principal:
			return [
				userPermissions.manageTeachers,
				userPermissions.viewAnalytics,
				userPermissions.viewCalendar,
				userPermissions.viewDashboard,
				userPermissions.viewClassAttendance,
				userPermissions.viewNews,
				userPermissions.createNews,
				userPermissions.archiveNews,
				userPermissions.viewCourseMap,
			]
		case userTypeEnum.admin:
			return [
				userPermissions.viewAdmin,
				userPermissions.viewDashboard,
				userPermissions.viewCalendar,
				userPermissions.viewAnalytics,
				userPermissions.manageTeachers,
				userPermissions.viewTasks,
				userPermissions.viewClassAttendance,
				userPermissions.viewNews,
				userPermissions.createNews,
				userPermissions.archiveNews,
				userPermissions.viewCourseMap,
			]
		default:
			return []
	}
}
