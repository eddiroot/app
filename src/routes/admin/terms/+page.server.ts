import {
	getSchoolById,
	getSemestersWithTermsBySchoolId,
	updateSchoolTerm,
} from '$lib/server/db/service/school'
import { fail, superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import { updateTermSchema } from './schema'

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser()
	const currentYear = new Date().getFullYear()

	const semestersWithTerms = await getSemestersWithTermsBySchoolId(
		user.schoolId,
	)

	const school = await getSchoolById(security.getUser().schoolId)
	if (!school) {
		throw new Error('School not found')
	}

	return { semestersWithTerms, currentYear }
}

export const actions = {
	updateTerm: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isAdmin()
		const form = await superValidate(request, zod4(updateTermSchema))
		if (!form.valid) {
			return fail(400, { form })
		}
		const { termId, start, end } = form.data
		await updateSchoolTerm(termId, { start, end })
	},
}
