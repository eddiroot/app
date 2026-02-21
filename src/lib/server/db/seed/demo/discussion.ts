import {
	subjectThreadResponseTypeEnum,
	subjectThreadTypeEnum,
} from '$lib/enums';
import { eq } from 'drizzle-orm';
import * as schema from '../../schema';
import type { Database } from '../types';
import type { DemoSchoolData, DemoSubjectData, DemoUserData } from './types';

// Seeded random number generator for consistent results
function seededRandom(seed: number): () => number {
	return function () {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};
}

// Fisher-Yates shuffle with seeded random
function shuffle<T>(array: T[], random: () => number): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

// Thread content templates by subject and type
const THREAD_TEMPLATES: Record<
	string,
	Record<string, { title: string; content: string }[]>
> = {
	Mathematics: {
		discussion: [
			{
				title: 'Best way to remember formulas?',
				content:
					"I'm having trouble remembering all the formulas for our upcoming test. Does anyone have good memorization techniques or tricks they use?",
			},
			{
				title: 'Study group for algebra?',
				content:
					"Hey everyone! I'm thinking of starting a study group for algebra. Would anyone be interested in meeting after school on Wednesdays?",
			},
			{
				title: 'Graphing calculator tips',
				content:
					"Just discovered some cool shortcuts on the graphing calculator. Happy to share if anyone's interested!",
			},
		],
		question: [
			{
				title: 'Help with quadratic equations',
				content:
					'Can someone explain how to use the quadratic formula when c is negative? I keep getting stuck on question 5 from the homework.',
			},
			{
				title: 'Confused about BODMAS',
				content:
					'Is it BODMAS or PEMDAS? And does it matter which one we use? My previous school used different terminology.',
			},
			{
				title: 'Why do we flip the inequality sign?',
				content:
					'When we multiply or divide by a negative number, we flip the inequality sign. I know this is the rule but WHY does it work?',
			},
		],
	},
	English: {
		discussion: [
			{
				title: 'Favorite book from the reading list?',
				content:
					"We've read so many books this semester! Which one was your favorite and why? I really enjoyed the poetry unit.",
			},
			{
				title: 'Essay writing workshop',
				content:
					'Anyone want to do peer reviews of our essays before submission? I find it really helpful to get feedback.',
			},
			{
				title: 'Shakespeare - love it or hate it?',
				content:
					"We're starting Romeo and Juliet next week. Who's excited? Who's dreading it? I'm curious what everyone thinks about Shakespeare.",
			},
		],
		question: [
			{
				title: 'MLA vs APA formatting',
				content:
					"Which citation format should we use for the research essay? The rubric mentions both but doesn't specify.",
			},
			{
				title: 'How to write a good thesis statement?',
				content:
					'My thesis statements always feel too vague. Does anyone have tips for making them more specific and arguable?',
			},
			{
				title: 'Symbolism in Chapter 4',
				content:
					"Can someone explain the symbolism of the green light? I feel like I'm missing something important.",
			},
		],
	},
	Science: {
		discussion: [
			{
				title: 'Lab safety reminders',
				content:
					"Since we're starting the chemistry experiments next week, what are everyone's tips for staying safe in the lab? I always forget my goggles!",
			},
			{
				title: 'Science fair project ideas',
				content:
					"Brainstorming ideas for the science fair. Anyone want to team up or share what topics you're thinking about?",
			},
			{
				title: 'Climate change discussion',
				content:
					'After the documentary we watched, I have so many thoughts. What did everyone else think about the solutions they proposed?',
			},
		],
		question: [
			{
				title: 'Difference between mitosis and meiosis?',
				content:
					'I always mix these up! Can someone give me a simple way to remember which is which and when they happen?',
			},
			{
				title: 'How does photosynthesis work?',
				content:
					"I understand that plants make food from sunlight, but I'm confused about the chemical equation. Can someone break it down?",
			},
			{
				title: 'Lab report format question',
				content:
					'For the conclusion section, do we need to reference our hypothesis? Mine was wrong - should I explain why?',
			},
		],
	},
	'Physical Education': {
		discussion: [
			{
				title: 'Fitness goals for the term',
				content:
					'What fitness goals is everyone setting for this term? I want to improve my running time for the beep test.',
			},
			{
				title: 'Team sport preferences',
				content:
					'We get to vote on the next sport we play. Who wants basketball vs soccer? Let me know your thoughts!',
			},
			{
				title: 'Stretching routines',
				content:
					"Does anyone have a good pre-workout stretching routine they'd recommend? Want to avoid injury this semester.",
			},
		],
		question: [
			{
				title: 'How to improve endurance?',
				content:
					"I get tired really quickly during the longer runs. What's the best way to build up stamina?",
			},
			{
				title: 'Rules of badminton?',
				content:
					"We're starting badminton next week but I've never played. What are the basic rules and scoring system?",
			},
			{
				title: 'Correct form for push-ups?',
				content:
					"I think I'm doing push-ups wrong because my lower back hurts after. Can someone describe the proper form?",
			},
		],
	},
	History: {
		discussion: [
			{
				title: 'Most interesting historical figure?',
				content:
					"From everything we've studied, who do you think is the most interesting historical figure and why?",
			},
			{
				title: 'History documentary recommendations',
				content:
					"Anyone know any good documentaries about World War II? Looking for something to watch over the weekend that's actually engaging.",
			},
			{
				title: 'Primary vs secondary sources',
				content:
					"I've been finding lots of interesting primary sources for my assignment. Want to share some good online archives!",
			},
		],
		question: [
			{
				title: 'Causes of World War I?',
				content:
					'There seem to be so many causes! Can someone help me prioritize which ones are most important for the essay?',
			},
			{
				title: 'Timeline of the Industrial Revolution',
				content:
					"I'm confused about the dates. When exactly did the Industrial Revolution start and end?",
			},
			{
				title: 'How to analyze historical sources?',
				content:
					"When we do source analysis, what should I look for? I never know if I'm finding enough points.",
			},
		],
	},
	Geography: {
		discussion: [
			{
				title: 'Environmental issues in our area',
				content:
					"After learning about environmental geography, I've noticed some issues locally. Anyone else observing this?",
			},
			{
				title: 'Virtual field trip ideas',
				content:
					"We're doing virtual field trips next week. What locations should we suggest to explore using Google Earth?",
			},
			{
				title: 'Map skills practice',
				content:
					'Anyone want to practice map reading together? I find it helpful to quiz each other on coordinates and grid references.',
			},
		],
		question: [
			{
				title: 'Difference between weather and climate?',
				content:
					"I know they're different but I always explain it wrong in tests. What's the clearest way to distinguish them?",
			},
			{
				title: 'How do tectonic plates move?',
				content:
					"I understand that they move but I'm confused about what causes them to move. Is it convection currents?",
			},
			{
				title: 'Population pyramid interpretation',
				content:
					'How do we read population pyramids? What does it mean when the base is wider than the top?',
			},
		],
	},
};

// Response templates for different thread types
const RESPONSE_TEMPLATES = {
	helpful: [
		"Great question! Here's what helped me understand this...",
		'I struggled with this too. Try thinking about it like...',
		'Our teacher explained this really well. Basically...',
		'I found a good video on YouTube that explains this perfectly!',
		'The textbook chapter on this is actually pretty clear, page...',
		'What helped me was practicing lots of examples.',
		'My older sibling taught me a trick for this.',
		'I think the key thing to remember is...',
	],
	agreement: [
		'I totally agree! This is such a good point.',
		'Yes! I was thinking the same thing.',
		'100% agree with this approach.',
		'This is exactly what I needed to hear, thanks!',
		"Same here! Glad I'm not the only one who thinks this.",
		'Great idea, count me in!',
	],
	followUp: [
		'Thanks for explaining! Just to clarify...',
		'That makes sense, but what about when...',
		'Ah I see! So does that mean...',
		'This is helpful! One more question though...',
		'Building on this, I was also wondering...',
		'Thanks! Can you give an example of...',
	],
	encouragement: [
		"You've got this! Keep practicing.",
		"Don't worry, everyone finds this tricky at first.",
		'It took me ages to get this too, but it clicks eventually.',
		"You're asking great questions - that's how we learn!",
		"This is a tough topic, but you're on the right track.",
		'Good luck with the assignment everyone!',
	],
	discussion: [
		"Interesting perspective! I hadn't thought of it that way.",
		"I see it differently - here's my take...",
		'Good point, but have you considered...',
		'I partly agree, but I think...',
		"That's a fair point. In my experience though...",
		'Building on what you said...',
	],
};

// Teacher announcement templates
const TEACHER_ANNOUNCEMENTS: Record<
	string,
	{ title: string; content: string }[]
> = {
	Mathematics: [
		{
			title: 'Upcoming Test - Study Guide Posted',
			content:
				'Hi everyone! The study guide for our algebra test has been posted. The test will cover chapters 4-6. Please review the practice problems and come to class with any questions. Office hours are available Wednesday after school.',
		},
		{
			title: 'Homework Extension',
			content:
				"Due to the school event on Friday, I'm extending the homework deadline to Monday. Please use the extra time to check your work carefully.",
		},
	],
	English: [
		{
			title: 'Essay Draft Due Date Reminder',
			content:
				'Just a reminder that your essay drafts are due this Friday. Please bring a printed copy for peer review. We will be workshopping in class.',
		},
		{
			title: 'Book Club Meeting',
			content:
				"Our optional book club meets Thursday at lunch in the library. We'll be discussing the themes from our current novel. All welcome!",
		},
	],
	Science: [
		{
			title: 'Lab Safety Requirements',
			content:
				'Before our chemistry lab next week, please ensure you have closed-toe shoes and your hair tied back. Safety goggles will be provided. No exceptions for lab participation without proper attire.',
		},
		{
			title: 'Science Fair Registration Open',
			content:
				'Science fair registration is now open! Projects can be individual or pairs. Please submit your project proposal by end of month.',
		},
	],
	'Physical Education': [
		{
			title: 'Sports Carnival Information',
			content:
				'The house sports carnival is coming up! Please register for your events by Friday. Remember to bring sunscreen and a water bottle on the day.',
		},
		{
			title: 'Fitness Testing Schedule',
			content:
				"We'll be conducting fitness testing over the next two weeks. Please wear appropriate athletic clothing and come prepared to do your best!",
		},
	],
	History: [
		{
			title: 'Research Essay Resources',
			content:
				"I've uploaded additional resources to help with your research essays. The school library also has a reserve shelf with relevant books. Librarian available for help during lunch.",
		},
		{
			title: 'Guest Speaker Next Week',
			content:
				'We have a special guest speaker next Tuesday who will share their experiences. Please come prepared with thoughtful questions!',
		},
	],
	Geography: [
		{
			title: 'Field Trip Permission Forms',
			content:
				'Please return your signed permission forms for our upcoming field trip by Wednesday. Students without forms will remain at school with an alternative assignment.',
		},
		{
			title: 'Map Skills Assessment',
			content:
				'Our map skills assessment is scheduled for Friday. Please review grid references, scale calculations, and compass directions. Practice maps are available online.',
		},
	],
};

export async function seedDemoThreads(
	db: Database,
	schoolData: DemoSchoolData,
	userData: DemoUserData,
	subjectData: DemoSubjectData,
): Promise<void> {
	const random = seededRandom(99999);
	const { offerings, subjects, subjectGroups } = subjectData;

	// Get students enrolled in each offering
	const getStudentsInOffering = async (
		offeringId: number,
	): Promise<(typeof schema.user.$inferSelect)[]> => {
		const enrollments = await db
			.select()
			.from(schema.userSubjectOffering)
			.where(eq(schema.userSubjectOffering.subOfferingId, offeringId));

		const studentIds = enrollments.map((e) => e.userId);
		return userData.students.filter((s) => studentIds.includes(s.id));
	};

	// Get teachers for an offering
	const getTeachersInOffering = async (
		offeringId: number,
	): Promise<(typeof schema.user.$inferSelect)[]> => {
		const enrollments = await db
			.select()
			.from(schema.userSubjectOffering)
			.where(eq(schema.userSubjectOffering.subOfferingId, offeringId));

		const teacherIds = enrollments.map((e) => e.userId);
		return userData.teachers.filter((t) => teacherIds.includes(t.id));
	};

	for (const offering of offerings) {
		const subject = subjects.find((s) => s.id === offering.subjectId);
		if (!subject) continue;

		const subjectGroup = subjectGroups.find(
			(cs) => cs.id === subject.subjectGroupId,
		);
		if (!subjectGroup) continue;

		const subjectName = subjectGroup.name;
		const templates = THREAD_TEMPLATES[subjectName];
		const announcements = TEACHER_ANNOUNCEMENTS[subjectName];
		if (!templates || !announcements) continue;

		const studentsInOffering = await getStudentsInOffering(offering.id);
		const teachersInOffering = await getTeachersInOffering(offering.id);

		if (studentsInOffering.length === 0) continue;

		const shuffledStudents = shuffle(studentsInOffering, random);

		// Create 1-2 discussions per offering
		const numDiscussions = 1 + Math.floor(random() * 2);
		for (
			let i = 0;
			i < numDiscussions && i < templates.discussion.length;
			i++
		) {
			const template = templates.discussion[i];
			const author = shuffledStudents[i % shuffledStudents.length];

			const [thread] = await db
				.insert(schema.subjectThread)
				.values({
					type: subjectThreadTypeEnum.discussion,
					subjectOfferingId: offering.id,
					userId: author.id,
					title: template.title,
					content: template.content,
					isAnonymous: random() < 0.1, // 10% anonymous
				})
				.returning();

			// Add 3-6 responses from different students
			const numResponses = 3 + Math.floor(random() * 4);
			const responders = shuffle(
				shuffledStudents.filter((s) => s.id !== author.id),
				random,
			).slice(0, numResponses);

			for (const responder of responders) {
				const responseType =
					random() < 0.3
						? 'agreement'
						: random() < 0.6
							? 'discussion'
							: 'encouragement';
				const responseContent =
					RESPONSE_TEMPLATES[responseType][
						Math.floor(random() * RESPONSE_TEMPLATES[responseType].length)
					];

				await db.insert(schema.subjectThreadResponse).values({
					type: subjectThreadResponseTypeEnum.comment,
					subjectThreadId: thread.id,
					userId: responder.id,
					content: responseContent,
					isAnonymous: random() < 0.05, // 5% anonymous
				});
			}

			// Add some likes to the thread
			const numLikes = Math.floor(random() * 8) + 2;
			const likers = shuffle(shuffledStudents, random).slice(0, numLikes);
			for (const liker of likers) {
				await db
					.insert(schema.subjectThreadLike)
					.values({ subjectThreadId: thread.id, userId: liker.id });
			}
		}

		// Create 1-2 questions per offering
		const numQuestions = 1 + Math.floor(random() * 2);
		for (let i = 0; i < numQuestions && i < templates.question.length; i++) {
			const template = templates.question[i];
			const author = shuffledStudents[(i + 3) % shuffledStudents.length];

			const [thread] = await db
				.insert(schema.subjectThread)
				.values({
					type: subjectThreadTypeEnum.question,
					subjectOfferingId: offering.id,
					userId: author.id,
					title: template.title,
					content: template.content,
					isAnonymous: random() < 0.15, // 15% anonymous for questions
				})
				.returning();

			// Add 2-5 helpful responses (answers)
			const numResponses = 2 + Math.floor(random() * 4);
			const responders = shuffle(
				shuffledStudents.filter((s) => s.id !== author.id),
				random,
			).slice(0, numResponses);

			for (let j = 0; j < responders.length; j++) {
				const responder = responders[j];
				const responseType =
					j === 0 ? 'helpful' : random() < 0.5 ? 'helpful' : 'followUp';
				const responseContent =
					RESPONSE_TEMPLATES[responseType][
						Math.floor(random() * RESPONSE_TEMPLATES[responseType].length)
					];

				const [response] = await db
					.insert(schema.subjectThreadResponse)
					.values({
						type: subjectThreadResponseTypeEnum.answer,
						subjectThreadId: thread.id,
						userId: responder.id,
						content: responseContent,
						isAnonymous: false,
					})
					.returning();

				// Add follow-up response from original author
				if (j === 0 && random() < 0.7) {
					const followUpContent =
						RESPONSE_TEMPLATES.followUp[
							Math.floor(random() * RESPONSE_TEMPLATES.followUp.length)
						];

					await db
						.insert(schema.subjectThreadResponse)
						.values({
							type: subjectThreadResponseTypeEnum.comment,
							subjectThreadId: thread.id,
							userId: author.id,
							content: followUpContent,
							parentResponseId: response.id,
							isAnonymous: false,
						});
				}

				// Add likes to helpful responses
				if (responseType === 'helpful') {
					const numLikes = Math.floor(random() * 5) + 1;
					const likers = shuffle(shuffledStudents, random).slice(0, numLikes);
					for (const liker of likers) {
						await db
							.insert(schema.subjectThreadResponseLike)
							.values({
								subjectThreadResponseId: response.id,
								userId: liker.id,
							});
					}
				}
			}
		}

		// Create teacher announcements (1 per offering)
		if (teachersInOffering.length > 0 && announcements.length > 0) {
			const teacher = teachersInOffering[0];
			const announcementIndex = Math.floor(random() * announcements.length);
			const announcement = announcements[announcementIndex];

			const [thread] = await db
				.insert(schema.subjectThread)
				.values({
					type: subjectThreadTypeEnum.announcement,
					subjectOfferingId: offering.id,
					userId: teacher.id,
					title: announcement.title,
					content: announcement.content,
					isAnonymous: false,
				})
				.returning();

			// Students might comment on announcements
			if (random() < 0.6) {
				const numComments = 1 + Math.floor(random() * 3);
				const commenters = shuffle(shuffledStudents, random).slice(
					0,
					numComments,
				);

				const studentComments = [
					'Thank you for the reminder!',
					'Got it, thanks!',
					'Looking forward to it!',
					'Will we need to bring anything else?',
					'Thanks for the extension!',
					"Can't wait for the field trip!",
					'Will there be extra practice problems available?',
					'Thanks for posting this!',
				];

				for (const commenter of commenters) {
					const comment =
						studentComments[Math.floor(random() * studentComments.length)];
					await db
						.insert(schema.subjectThreadResponse)
						.values({
							type: subjectThreadResponseTypeEnum.comment,
							subjectThreadId: thread.id,
							userId: commenter.id,
							content: comment,
							isAnonymous: false,
						});
				}
			}
		}
	}
}
