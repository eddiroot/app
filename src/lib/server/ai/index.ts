export async function geminiCompletion(
	prompt: string,
	systemInstruction: string,
): Promise<string> {
	return `This is a mock response for the prompt: ${prompt} with system instruction: ${systemInstruction}`
}
