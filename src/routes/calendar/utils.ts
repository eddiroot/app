export function generateTimeslots(
	dayStartHour: number,
	dayEndHour: number,
): string[] {
	const slots: string[] = [];
	for (let hour = dayStartHour; hour < dayEndHour; hour++) {
		if (hour === 0) {
			slots.push('12am');
		} else if (hour < 12) {
			slots.push(`${hour}am`);
		} else if (hour === 12) {
			slots.push('12pm');
		} else {
			slots.push(`${hour - 12}pm`);
		}
	}
	return slots;
}

export function getClassPosition(
	dayStartHour: number = 8,
	start: Date,
	end: Date,
	slotHeightPx: number,
) {
	const [startHour, startMinute] = [start.getHours(), start.getMinutes()];
	const [endHour, endMinute] = [end.getHours(), end.getMinutes()];

	const startMinutes = startHour * 60 + startMinute;
	const endMinutes = endHour * 60 + endMinute;
	const startOfDay = dayStartHour * 60;

	const slotIndex = (startMinutes - startOfDay) / 60;
	const topPosition = slotIndex * slotHeightPx;
	const durationInMinutes = endMinutes - startMinutes;
	const durationInSlots = durationInMinutes / 60;
	const height = durationInSlots * slotHeightPx;

	return { top: `${topPosition + 2}px`, height: `${height - 2}px` };
}

export function getEventPosition(
	dayStartHour: number = 8,
	start: Date,
	end: Date,
	columnOffset: number = 0,
	slotHeightPx: number,
) {
	const position = getClassPosition(dayStartHour, start, end, slotHeightPx);

	// Events take up the left 40% of the column, classes take the right 60%
	const leftOffset = columnOffset * 40; // 0 for first event, 40% for second, etc.
	const width = 40; // Each event takes 40% width max

	return { ...position, left: `${leftOffset}%`, width: `${width}%` };
}

export function generateSubjectColors(hue: number) {
	return {
		background: `light-dark(hsl(${hue}, 40%, 93%), hsl(${hue}, 50%, 16%))`,
		borderTop: `light-dark(hsl(${hue}, 55%, 58%), hsl(${hue}, 50%, 55%))`,
		borderAround: `light-dark(hsl(${hue}, 55%, 58%, 0.5), hsl(${hue}, 50%, 55%, 0.5))`,
		text: `light-dark(hsl(${hue}, 65%, 28%), hsl(${hue}, 35%, 87%))`,
	};
}
