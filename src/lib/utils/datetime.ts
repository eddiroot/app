export function formatTime(time: string): string {
	const [hours, minutes] = time.split(':').map(Number)
	const period = hours >= 12 ? 'pm' : 'am'
	const displayHours = hours % 12 || 12
	return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`
}

export function formatTimer(seconds: number): string {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const secs = Math.floor(seconds % 60)

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatTimestamp(timestamp: Date): string {
	return timestamp
		.toLocaleDateString('en-AU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		})
		.replace(/\s(?=am|pm)/g, '')
}

export function formatTimestampAsDate(timestamp: Date): string {
	return timestamp.toLocaleDateString('en-AU', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
}

export function formatTimestampAsTime(timestamp: Date): string {
	return timestamp
		.toLocaleTimeString('en-AU', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		})
		.replace(/\s/g, '')
}

export function toLocalDatetimeString(date: Date | string | null): string {
	if (!date) return ''
	const d = new Date(date)
	// Adjust for timezone offset to get local time
	const offset = d.getTimezoneOffset() * 60000 // offset in milliseconds
	const localTime = new Date(d.getTime() - offset)
	return localTime.toISOString().slice(0, 16)
}

export function formatDate(dateString: string) {
	const date = new Date(dateString)
	return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}

export const days = [
	{ name: 'Monday', shortName: 'Mon', value: 'monday', number: 1 },
	{ name: 'Tuesday', shortName: 'Tue', value: 'tuesday', number: 2 },
	{ name: 'Wednesday', shortName: 'Wed', value: 'wednesday', number: 3 },
	{ name: 'Thursday', shortName: 'Thu', value: 'thursday', number: 4 },
	{ name: 'Friday', shortName: 'Fri', value: 'friday', number: 5 },
]
