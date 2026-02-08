export function parseCSVHeaders(csvText: string): string[] {
	const lines = csvText.split('\n')
	if (lines.length === 0) return []
	const headerLine = lines[0].trim()
	return headerLine
		.split(',')
		.map((header) => header.trim().replace(/['"]/g, ''))
}

export interface CSVValidationResult {
	isValid: boolean
	foundColumns: string[]
	missingColumns: string[]
	extraColumns: string[]
}

export async function validateCSVFile(
	file: File,
	requiredColumns: string[],
	optionalColumns: string[] = [],
): Promise<CSVValidationResult> {
	try {
		const text = await file.text()
		const foundColumns = parseCSVHeaders(text)

		const missingColumns = requiredColumns.filter(
			(col) =>
				!foundColumns.some(
					(found) => found.toLowerCase() === col.toLowerCase(),
				),
		)

		const extraColumns = foundColumns.filter(
			(col) =>
				!requiredColumns.some(
					(req) => req.toLowerCase() === col.toLowerCase(),
				) &&
				!optionalColumns.some((opt) => opt.toLowerCase() === col.toLowerCase()),
		)

		return {
			isValid: missingColumns.length === 0,
			foundColumns,
			missingColumns,
			extraColumns,
		}
	} catch (error) {
		console.error('Error validating CSV:', error)
		return {
			isValid: false,
			foundColumns: [],
			missingColumns: requiredColumns,
			extraColumns: [],
		}
	}
}

// CSV parsing utilities
export function parseCSVRow(row: string): string[] {
	const values: string[] = []
	let current = ''
	let inQuotes = false
	let i = 0

	while (i < row.length) {
		const char = row[i]
		const nextChar = row[i + 1]

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote
				current += '"'
				i += 2
			} else {
				// Toggle quote state
				inQuotes = !inQuotes
				i++
			}
		} else if (char === ',' && !inQuotes) {
			// End of field
			values.push(current.trim())
			current = ''
			i++
		} else {
			current += char
			i++
		}
	}

	// Add the last field
	values.push(current.trim())
	return values
}

/**
 * Calculates duration in minutes between two time strings (HH:MM:SS format)
 */
export function calculateDurationMinutes(start: string, end: string): number {
	const [startHour, startMin] = start.split(':').map(Number)
	const [endHour, endMin] = end.split(':').map(Number)

	const startTotalMin = startHour * 60 + startMin
	const endTotalMin = endHour * 60 + endMin

	return endTotalMin - startTotalMin
}

export function parseCSVData(csvText: string): Array<Record<string, string>> {
	const lines = csvText.split('\n').filter((line) => line.trim())
	if (lines.length <= 1) return []

	const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase())
	const data: Array<Record<string, string>> = []

	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVRow(lines[i])
		if (values.length >= headers.length && values.some((v) => v.trim())) {
			const rowData: Record<string, string> = {}
			headers.forEach((header, index) => {
				rowData[header] = values[index] || ''
			})
			data.push(rowData)
		}
	}

	return data
}
