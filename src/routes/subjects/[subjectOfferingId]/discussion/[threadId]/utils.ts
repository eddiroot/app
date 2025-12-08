import { userTypeEnum } from '$lib/enums';
import type { SubjectThreadResponse } from '$lib/server/db/schema';

export function getNestedResponses(
	allResponses: {
		response: SubjectThreadResponse;
		user: {
			id: string;
			firstName: string;
			middleName: string | null;
			lastName: string;
			avatarUrl: string | null;
			type: string;
		};
	}[]
) {
	const responseMap = new Map();
	const topLevelResponses = [];

	for (const response of allResponses) {
		responseMap.set(response.response.id, {
			...response,
			replies: []
		});
	}

	for (const response of allResponses) {
		if (response.response?.parentResponseId) {
			const parent = responseMap.get(response.response.parentResponseId);
			if (parent) {
				parent.replies.push(responseMap.get(response.response.id));
			}
		} else {
			topLevelResponses.push(responseMap.get(response.response.id));
		}
	}

	return topLevelResponses;
}

/**
 * Determines if user information should be shown for a post/response
 * @param isAnonymous - Whether the post/response is marked as anonymous
 * @param currentUserId - ID of the currently logged-in user
 * @param currentUserType - Type of the currently logged-in user (student, teacher, etc.)
 * @param authorId - ID of the post/response author
 * @returns true if user info should be shown, false if it should be anonymous
 */
export function shouldShowUserInfo(isAnonymous: boolean, currentUserType: string): boolean {
	if (!isAnonymous) return true;

	// Non-students can always see the name (teachers, staff, etc.)
	if (currentUserType !== userTypeEnum.student) return true;

	// Students cannot see anonymous authors, even their own
	return false;
}

/**
 * Determines if user information should be shown for an OP's response
 * When the OP replies to their own anonymous thread, the reply should also be anonymous
 * unless they explicitly unmark it
 * @param responseIsAnonymous - Whether the response itself is marked as anonymous
 * @param threadIsAnonymous - Whether the original thread is anonymous
 * @param isOPResponse - Whether this response is from the original poster
 * @param currentUserId - ID of the currently logged-in user
 * @param currentUserType - Type of the currently logged-in user
 * @param authorId - ID of the response author
 * @returns true if user info should be shown, false if it should be anonymous
 */
export function shouldShowResponseUserInfo(
	responseIsAnonymous: boolean,
	threadIsAnonymous: boolean,
	isOPResponse: boolean,
	currentUserType: string
): boolean {
	// For OP responses on anonymous threads, default to anonymous unless explicitly unmarked
	const effectivelyAnonymous =
		isOPResponse && threadIsAnonymous ? responseIsAnonymous : responseIsAnonymous;

	return shouldShowUserInfo(effectivelyAnonymous, currentUserType);
}

export function getThreadTypeDisplay(type: string): string {
	switch (type) {
		case 'discussion':
			return 'Discussion';
		case 'question':
			return 'Question';
		case 'announcement':
			return 'Announcement';
		case 'qanda':
			return 'Q&A';
		default:
			return 'Thread';
	}
}

export function getResponseTypeDescription(type: string): string {
	switch (type) {
		case 'answer':
			return 'Provide a helpful answer to solve this question';
		case 'comment':
			return 'Share your thoughts or ask for clarification';
		default:
			return '';
	}
}
