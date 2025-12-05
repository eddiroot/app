export function generateTimeslots(dayStartHour: number, dayEndHour: number): string[] {
	const slots: string[] = [];
	for (let hour = dayStartHour; hour < dayEndHour; hour++) {
		slots.push(`${hour.toString().padStart(2, '0')}:00`);
		slots.push(`${hour.toString().padStart(2, '0')}:30`);
	}
	return slots;
}

export function getClassPosition(
	dayStartHour: number = 8,
	startTime: string,
	endTime: string,
	slotHeightPx: number
) {
	// Parse time strings (HH:MM:SS format)
	const [startHour, startMinute] = startTime.split(':').map(Number);
	const [endHour, endMinute] = endTime.split(':').map(Number);
	
	const startMinutes = startHour * 60 + startMinute;
	const endMinutes = endHour * 60 + endMinute;
	const startOfDay = dayStartHour * 60;

	const slotIndex = (startMinutes - startOfDay) / 30;
	const topPosition = slotIndex * slotHeightPx;
	const durationInMinutes = endMinutes - startMinutes;
	const durationInSlots = durationInMinutes / 30;
	const height = durationInSlots * slotHeightPx;

	return {
		top: `${topPosition + 2}px`,
		height: `${height - 2}px`
	};
}

export function getEventPosition(
	dayStartHour: number = 8,
	startTimestamp: Date,
	endTimestamp: Date,
	columnOffset: number = 0,
	slotHeightPx: number
) {
	// Extract time from timestamps for events (they still use timestamps)
	const startTime = `${startTimestamp.getHours().toString().padStart(2, '0')}:${startTimestamp.getMinutes().toString().padStart(2, '0')}:00`;
	const endTime = `${endTimestamp.getHours().toString().padStart(2, '0')}:${endTimestamp.getMinutes().toString().padStart(2, '0')}:00`;
	
	const position = getClassPosition(dayStartHour, startTime, endTime, slotHeightPx);

	// Events take up the left 40% of the column, classes take the right 60%
	const leftOffset = columnOffset * 40; // 0 for first event, 40% for second, etc.
	const width = 40; // Each event takes 40% width max

	return {
		...position,
		left: `${leftOffset}%`,
		width: `${width}%`
	};
}

export function generateSubjectColors(hue: number) {
	return {
		background: `light-dark(hsl(${hue}, 40%, 93%), hsl(${hue}, 50%, 16%))`,
		borderTop: `light-dark(hsl(${hue}, 55%, 58%), hsl(${hue}, 50%, 55%))`,
		borderAround: `light-dark(hsl(${hue}, 55%, 58%, 0.5), hsl(${hue}, 50%, 55%, 0.5))`,
		text: `light-dark(hsl(${hue}, 65%, 28%), hsl(${hue}, 35%, 87%))`
	};
}
