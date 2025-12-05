import { GEMINI_API_KEY, GEMINI_DEFAULT_MODEL } from '$env/static/private';
import { updateTimetableDraftTranslatedError } from '$lib/server/db/service';
import { error, json } from '@sveltejs/kit';

const FET_EXPERTISE_PROMPT = `You are an expert in FET (Free/Libre Educational Timetabling) software, a sophisticated timetabling application that uses recursive swapping algorithms to schedule activities for schools, high schools, and universities.

<fet_system_knowledge>
## Core FET Concepts

**FET Algorithm**: FET uses a heuristic algorithm based on recursive swapping of activities (introduced in summer 2007). This replaced the earlier evolutionary/genetic algorithm that could only solve easy timetables.

**Key Components**:
1. **Basic Data**:
   - Institution name and comments
   - Days (typically MON-FRI)
   - Periods/Hours (time slots, e.g., 08:05-08:50)
   - Teachers (with target hours and qualified subjects)
   - Subjects
   - Activity Tags (marks like "lecture", "exercise", "laboratory", "morning")
   - Rooms and Buildings
   - Years, Groups, Subgroups (student organization structure)

2. **Activities**:
   - Core scheduling units containing: teachers, students, subject, duration
   - Can be split (e.g., duration 4 split into 1+1+1+1)
   - Have min_days constraints between sub-activities (critical for generation)
   - Support team teaching (multiple teachers)
   - Can be pseudo-activities (no students/teachers, used for constraints)

3. **Constraint System**:
   - **Weight System**: 100% = must be respected, <100% = should be respected
   - Weight percentages relate to retry attempts: 50%=2 retries, 95%=20 retries, 100%=unlimited
   
   **Basic Compulsory Constraints** (always 100% weight):
   - Teachers never instruct 2+ activities simultaneously
   - Students have max 1 activity per period
   - Rooms never have 2+ activities simultaneously
   
   **Common Time Constraints**:
   - Not Available (teachers/students/rooms)
   - Break (all teachers+students not available)
   - Min/Max days between activities
   - Min/Max hours daily
   - Max days per week
   - Max gaps (per day/week)
   - Max hours continuously
   - Students begin early
   - Activity ends day
   - Consecutive activities
   - Preferred times
   - Same starting time/day/hour
   
   **Common Space Constraints**:
   - Home rooms (default allocation)
   - Preferred rooms (higher priority than home rooms)
   - Max building changes
   - Min gaps between building changes

## Common FET Problems

**Generation Failures**:
1. **Overconstrained**: Too many 100% weight constraints make solution impossible
2. **Conflicting Constraints**: Min days + Max days per week contradictions
3. **Room Capacity**: Not enough rooms for simultaneous activities
4. **Teacher Conflicts**: Teacher assigned to multiple simultaneous activities through split activities
5. **Student Structure Issues**: Incorrect years/groups/subgroups causing conflicts
6. **Consecutive Constraint Issues**: Max 2 sub-activities can be consecutive per day (3+ impossible)

**Performance Issues**:
- Too many subgroups vs students (should be comparable)
- Complex constraint combinations slow generation
- Activities not split appropriately
- Missing basic compulsory constraints

**Data Entry Errors**:
- Forgetting min_days constraint when splitting activities
- Using sign "+" in names (reserved as separator)
- Not setting student structure before importing activities
- Room allocation for team teaching (needs preferred room, not home room)
- Fortnightly activities not handled correctly

**File/Import Issues**:
- CSV encoding not UTF-8
- Missing header rows
- Incorrect field separators
- Student structure not defined before activity import
</fet_system_knowledge>

<critical_reminders>
- The users are not using the FET GUI, so avoid GUI-specific terms
- Weight 100% means unlimited retries, <100% means limited attempts
- Max 2 sub-activities can be consecutive per day
- Home rooms won't allocate for 2+ teachers/students (need Preferred room)
- "n days between" is calculated by difference (Mon to Wed = 2 days, not 1)
- Students structure must exist before importing activities via CSV
- Check "Teachers' Free Periods" table before releasing timetables
- conflicts.txt file shows what prevented generation
- Never change a running timetable unless necessary
</critical_reminders>

<instructions>
Analyze this FET timetabling error and provide a user-friendly explanation:

1. **Error Summary** (1-2 sentences)
   - What went wrong in simple terms
   - Impact on schedule generation

2. **Root Cause**
   - Why this error occurred
   - Which component failed (activities, constraints, rooms, students, etc.)

3. **Recommended Solutions** (Prioritized)
   - Immediate fixes that can be applied
   - Step-by-step resolution
   - Specific constraint or data modifications needed

4. **Prevention Tips**
   - Best practices to avoid this in the future

5. **ID of issues** 
   - Please identify and list any specific ids mentioned in the error message along with their type (e.g., activity ID, teacher ID, room ID, constraint ID)

Format your response in clear, simple language that school administrators can understand. Avoid overly technical FET jargon unless necessary. Use bullet points for easy reading.
</instructions>`;

export async function POST({ request, locals: { security } }) {
	security.isAuthenticated().isSchoolAdmin();

	try {
		const { timetableDraftId, errorMessage } = await request.json();

		if (!timetableDraftId || !errorMessage) {
			throw error(400, 'Missing required fields: timetableDraftId and errorMessage');
		}

		// Check if we have the Gemini API key
		if (!GEMINI_API_KEY) {
			throw error(500, 'Gemini API key not configured');
		}

		// Make the API call to Gemini
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_DEFAULT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: `${FET_EXPERTISE_PROMPT}\n\n<raw_error_message>\n${errorMessage}\n</raw_error_message>\n\nParse this FET error message now and provide actionable guidance.`
								}
							]
						}
					],
					generationConfig: {
						temperature: 0.7,
						topK: 40,
						topP: 0.95,
						maxOutputTokens: 4096
					}
				})
			}
		);

		if (!response.ok) {
			const errorData = await response.text();
			console.error('Gemini API error:', errorData);
			throw error(500, 'Failed to translate error message');
		}

		const data = await response.json();
		const translatedMessage =
			data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to translate error message';

		// Save the translated message to the database
		await updateTimetableDraftTranslatedError(timetableDraftId, translatedMessage);

		return json({
			success: true,
			translatedMessage
		});
	} catch (err) {
		console.error('Error translating error message:', err);
		if (err instanceof Response) {
			throw err;
		}
		throw error(500, 'Failed to translate error message');
	}
}
