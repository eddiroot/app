export const steps = {
	times: {
		percentage: 10,
		url: 'times',
		label: 'Times',
		previous: null,
		next: 'subjects'
	},
	subjects: {
		percentage: 20,
		url: 'subjects',
		label: 'Subjects',
		previous: 'times',
		next: 'teachers'
	},
	teachers: {
		percentage: 30,
		url: 'teachers',
		label: 'Teachers',
		previous: 'subjects',
		next: 'studentgroups'
	},
	studentgroups: {
		percentage: 40,
		url: 'studentgroups',
		label: 'Student Groups',
		previous: 'teachers',
		next: 'buildings'
	},
	buildings: {
		percentage: 50,
		url: 'buildings',
		label: 'Buildings',
		previous: 'studentgroups',
		next: 'spaces'
	},
	spaces: {
		percentage: 60,
		url: 'spaces',
		label: 'Spaces',
		previous: 'buildings',
		next: 'activities'
	},
	activities: {
		percentage: 70,
		url: 'activities',
		label: 'Activities',
		previous: 'spaces',
		next: 'constraints'
	},
	constraints: {
		percentage: 80,
		url: 'constraints',
		label: 'Constraints',
		previous: 'activities',
		next: 'generate'
	},
	generate: {
		percentage: 90,
		url: 'generate',
		label: 'Generate',
		previous: 'constraints',
		next: 'result'
	},
	result: {
		percentage: 100,
		url: 'result',
		label: 'Result',
		previous: 'generate',
		next: null
	}
};
