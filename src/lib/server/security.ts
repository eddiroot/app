import { userTypeEnum } from '$lib/enums';
import { error, redirect, type RequestEvent } from '@sveltejs/kit';

export class Security {
	private readonly user?: import('$lib/server/auth').SessionValidationResult['user'];

	constructor(event: RequestEvent) {
		this.user = event.locals.user;
	}

	isAuthenticated() {
		if (!this.user) {
			redirect(303, '/login');
		}
		return this;
	}

	isStudent() {
		if (!this.user?.type || this.user.type !== userTypeEnum.student) {
			error(403, 'not student');
		}
		return this;
	}

	isTeacher() {
		if (!this.user?.type || this.user.type !== userTypeEnum.teacher) {
			error(403, 'not teacher');
		}
		return this;
	}

	isGuardian() {
		if (!this.user?.type || this.user.type !== userTypeEnum.guardian) {
			error(403, 'not guardian');
		}
		return this;
	}

	isPrincipal() {
		if (!this.user?.type || this.user.type !== userTypeEnum.principal) {
			error(403, 'not principal');
		}
		return this;
	}

	isAdmin() {
		if (!this.user?.type || this.user.type !== userTypeEnum.admin) {
			error(403, 'not school admin');
		}
		return this;
	}

	getUser() {
		if (!this.user) {
			redirect(303, '/login');
		}
		return this.user;
	}
}
