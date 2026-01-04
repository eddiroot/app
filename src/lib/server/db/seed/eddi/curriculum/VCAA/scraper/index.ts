/*eslint-disable @typescript-eslint/no-explicit-any */
import * as cheerio from 'cheerio';

export interface ContentItem {
	learningArea: string;
	yearLevel: string;
	vcaaCode: string;
	description: string;
	elaborations: string[];
	strand: string;
}

export interface StandardElaboration {
	name: string;
	standardElaboration: string;
}

export interface LearningAreaStandard {
	name: string;
	description: string;
	yearLevel: string;
	elaborations: StandardElaboration[];
}

export interface LearningAreaContent {
	name: string;
	description?: string;
	standards: LearningAreaStandard[];
}

export interface SubjectContent {
	subject: string;
	learningAreas: LearningAreaContent[];
}

export class VCAAF10Scraper {
	private baseUrl = 'https://f10.vcaa.vic.edu.au';
	private delayBetweenRequests = 2000;

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async fetchPage(url: string): Promise<string> {
		await this.delay(this.delayBetweenRequests);

		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				'Accept-Encoding': 'gzip, deflate, br',
				Connection: 'keep-alive',
				'Upgrade-Insecure-Requests': '1'
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
		}
		return response.text();
	}

	private async fetchJsonApi(url: string): Promise<any> {
		await this.delay(this.delayBetweenRequests);

		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'application/json',
				'Accept-Language': 'en-US,en;q=0.5',
				Connection: 'keep-alive'
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch JSON API ${url}: ${response.statusText}`);
		}

		const jsonData = await response.json();
		return jsonData;
	}

	private async fetchCurriculumFromJsonApi(subject: string): Promise<SubjectContent> {
		const buildId = 'TAMN1X7HNnirEhmmr2Imt'; // This may need updating if it changes
		const { apiPath, slugs } = this.getApiPathForSubject(subject);

		const jsonApiUrl = `${this.baseUrl}/_next/data/${buildId}${apiPath}?${slugs}`;

		try {
			const jsonData = await this.fetchJsonApi(jsonApiUrl);
			return this.parseJsonApiCurriculumData(jsonData, subject);
		} catch (error) {
			console.error(`Failed to fetch JSON API for ${subject}:`, error);
			return this.extractContentFromHtml(subject);
		}
	}

	private getApiPathForSubject(subject: string): { apiPath: string; slugs: string } {
		const subjectLower = subject.toLowerCase();

		// Define the correct API paths and slug patterns for each subject
		const apiMappings: { [key: string]: { path: string; slugs: string[] } } = {
			mathematics: {
				path: '/learning-areas/mathematics/curriculum.json',
				slugs: ['learning-areas', 'mathematics', 'curriculum']
			},
			english: {
				path: '/learning-areas/english/english/curriculum.json',
				slugs: ['learning-areas', 'english', 'english', 'curriculum']
			},
			science: {
				path: '/learning-areas/science/curriculum.json',
				slugs: ['learning-areas', 'science', 'curriculum']
			},
			history: {
				path: '/learning-areas/humanities/history/curriculum.json',
				slugs: ['learning-areas', 'humanities', 'history', 'curriculum']
			},
			geography: {
				path: '/learning-areas/humanities/geography/curriculum.json',
				slugs: ['learning-areas', 'humanities', 'geography', 'curriculum']
			},
			'civics and citizenship': {
				path: '/learning-areas/humanities/civics-and-citizenship/curriculum.json',
				slugs: ['learning-areas', 'humanities', 'civics-and-citizenship', 'curriculum']
			},
			'economics and business': {
				path: '/learning-areas/humanities/economics-and-business/curriculum.json',
				slugs: ['learning-areas', 'humanities', 'economics-and-business', 'curriculum']
			},
			'health and physical education': {
				path: '/learning-areas/health-and-physical-education/curriculum.json',
				slugs: ['learning-areas', 'health-and-physical-education', 'curriculum']
			},
			'design and technologies': {
				path: '/learning-areas/technologies/design-and-technologies/curriculum.json',
				slugs: ['learning-areas', 'technologies', 'design-and-technologies', 'curriculum']
			},
			'digital technologies': {
				path: '/learning-areas/technologies/digital-technologies/curriculum.json',
				slugs: ['learning-areas', 'technologies', 'digital-technologies', 'curriculum']
			},
			dance: {
				path: '/learning-areas/the-arts/dance/curriculum.json',
				slugs: ['learning-areas', 'the-arts', 'dance', 'curriculum']
			},
			drama: {
				path: '/learning-areas/the-arts/drama/curriculum.json',
				slugs: ['learning-areas', 'the-arts', 'drama', 'curriculum']
			},
			'media arts': {
				path: '/learning-areas/the-arts/media-arts/curriculum.json',
				slugs: ['learning-areas', 'the-arts', 'media-arts', 'curriculum']
			},
			music: {
				path: '/learning-areas/the-arts/music/curriculum.json',
				slugs: ['learning-areas', 'the-arts', 'music', 'curriculum']
			},
			'visual arts': {
				path: '/learning-areas/the-arts/visual-arts/curriculum.json',
				slugs: ['learning-areas', 'the-arts', 'visual-arts', 'curriculum']
			},
			'visual communication design': {
				path: '/learning-areas/the-arts/visual-communication-design/curriculum.json',
				slugs: ['learning-areas', 'the-arts', 'visual-communication-design', 'curriculum']
			}
		};

		const mapping = apiMappings[subjectLower];
		if (mapping) {
			const slugParams = mapping.slugs.map((slug) => `slug=${slug}`).join('&');
			return { apiPath: mapping.path, slugs: slugParams };
		}

		// Fallback for unknown subjects
		const fallbackSubject = subjectLower.replace(/\s+/g, '-').replace(/&/g, 'and');
		return {
			apiPath: `/learning-areas/${fallbackSubject}/curriculum.json`,
			slugs: `slug=learning-areas&slug=${fallbackSubject}&slug=curriculum`
		};
	}

	private async extractContentFromNewStructure($: any, subject: string): Promise<SubjectContent> {
		// Look for JSON data in script tags (Next.js pattern)
		const jsonData = this.extractJsonDataFromPage($);
		if (jsonData) {
			return this.parseJsonCurriculumData(jsonData, subject);
		}

		// Fallback to HTML scraping if no JSON data found
		return this.fallbackHtmlScraping($, subject);
	}

	private async extractContentFromHtml(subject: string): Promise<SubjectContent> {
		const curriculumUrl = `${this.baseUrl}/learning-areas/${subject}/curriculum`;
		const html = await this.fetchPage(curriculumUrl);
		const $ = cheerio.load(html);

		return this.extractContentFromNewStructure($, subject);
	}

	private extractJsonDataFromPage($: any): any {
		// Look for Next.js __NEXT_DATA__ script tag
		const scriptTags = $('script[id="__NEXT_DATA__"]');
		if (scriptTags.length > 0) {
			try {
				const jsonText = scriptTags.first().html();
				if (jsonText) {
					const data = JSON.parse(jsonText);
					return data;
				}
			} catch (error) {
				console.error('Error parsing __NEXT_DATA__:', error);
			}
		}

		// Look for other script tags with JSON data
		const allScripts = $('script');
		for (let i = 0; i < allScripts.length; i++) {
			const scriptContent = $(allScripts[i]).html();
			if (
				scriptContent &&
				scriptContent.includes('contentDescriptions') &&
				scriptContent.includes('VC2')
			) {
				try {
					// Try to extract JSON from script content
					const jsonMatch = scriptContent.match(/({.*"contentDescriptions".*})/);
					if (jsonMatch) {
						return JSON.parse(jsonMatch[1]);
					}
				} catch (error) {
					console.error('Error parsing script JSON:', error);
				}
			}
		}

		return null;
	}

	private parseJsonApiCurriculumData(jsonData: any, subject: string): SubjectContent {
		try {
			// Navigate to the curriculum data structure from direct JSON API response
			const curriculumData = jsonData?.pageProps?.additionalContent?.curriculum;

			if (!curriculumData) {
				return { subject: this.mapSubjectToLearningArea(subject), learningAreas: [] };
			}

			// Get curriculum content from pathways
			const pathways = curriculumData.pathways || [];

			const learningAreas: LearningAreaContent[] = [];

			for (const pathway of pathways) {
				if (pathway.curriculum && Array.isArray(pathway.curriculum)) {
					for (const levelData of pathway.curriculum) {
						if (
							levelData.contentDescriptionsContent &&
							Array.isArray(levelData.contentDescriptionsContent)
						) {
							// Extract the level information from levelData
							const levelInfo = this.extractLevelFromLevelData(levelData);

							for (const strandData of levelData.contentDescriptionsContent) {
								// Handle strands and substrands, passing level info
								this.extractLearningAreasFromStrand(strandData, learningAreas, levelInfo);
							}
						}
					}
				}
			}

			return {
				subject: this.mapSubjectToLearningArea(subject),
				learningAreas: learningAreas
			};
		} catch (error) {
			console.error('Error parsing JSON API curriculum data:', error);
			return { subject: this.mapSubjectToLearningArea(subject), learningAreas: [] };
		}
	}

	private extractLevelFromLevelData(levelData: any): string {
		// Extract year level from the level data structure
		// Handle different API formats: single levels, ranges, foundation variations

		if (levelData.level) {
			const level = levelData.level.toString();

			// Handle Foundation levels first
			if (level.includes('Foundation Level A')) {
				return 'Foundation';
			} else if (level.includes('Foundation Level B')) {
				return 'Foundation';
			} else if (level.includes('Foundation Level C')) {
				return 'Foundation';
			} else if (level.includes('Foundation Level D')) {
				return 'Foundation';
			} else if (level === 'Foundation') {
				return 'Foundation';
			}

			// Handle range-based levels like "Foundation to Level 2"
			if (level.includes('Foundation to Level')) {
				const levelMatch = level.match(/Foundation to Level\s*(\d+)/i);
				if (levelMatch) {
					return `Foundation-Level ${levelMatch[1]}`;
				}
			}

			// Handle range levels like "Levels 3 and 4"
			const rangeMatch = level.match(/Levels\s*(\d+)\s*and\s*(\d+)/i);
			if (rangeMatch) {
				const startLevel = rangeMatch[1];
				const endLevel = rangeMatch[2];
				return `Level ${startLevel}-${endLevel}`;
			}

			// Handle range levels like "Levels 1 and 2"
			const levelPairMatch = level.match(/Levels\s*(\d+)\s*and\s*(\d+)/i);
			if (levelPairMatch) {
				const level1 = levelPairMatch[1];
				const level2 = levelPairMatch[2];
				return `Level ${level1}-${level2}`;
			}

			// Handle single levels like "Level 1", "Level 2", etc.
			const singleLevelMatch = level.match(/^Level\s*(\d+)$/i);
			if (singleLevelMatch) {
				const levelNum = singleLevelMatch[1];
				if (levelNum === '10' && level.includes('A')) {
					return 'Level 10A';
				}
				return `Level ${levelNum}`;
			}
		}

		// Handle cases where we need to use the ID field directly
		if (levelData.id) {
			const id = levelData.id.toString();

			// Foundation level variations
			if (id === 'FLA' || id === 'FLB' || id === 'FLC' || id === 'FLD' || id === 'F') {
				return 'Foundation';
			}

			// Range IDs like "3–4", "5–6", "F–2"
			if (id.includes('–')) {
				const parts = id.split('–');
				if (parts.length === 2) {
					const start = parts[0].trim();
					const end = parts[1].trim();

					// Handle Foundation ranges like "F–2"
					if (start === 'F') {
						return `Foundation-Level ${end}`;
					}

					// Handle numeric ranges like "3–4"
					if (!isNaN(parseInt(start, 10)) && !isNaN(parseInt(end, 10))) {
						return `Level ${start}-${end}`;
					}
				}
			}

			// Single numeric levels
			if (!isNaN(parseInt(id, 10))) {
				const levelNum = parseInt(id, 10);
				return `Level ${levelNum}`;
			}
		}

		// Fallback to Foundation if we can't determine level
		console.warn('Could not determine level from levelData:', JSON.stringify(levelData, null, 2));
		return 'Foundation';
	}

	private extractLearningAreasFromStrand(
		strandData: any,
		learningAreas: LearningAreaContent[],
		levelInfo: string
	): void {
		// Special handling for Science curriculum - flatten substrands under main strand
		const isScience =
			strandData.title === 'Science as a Human Endeavour' ||
			strandData.title === 'Science Understanding' ||
			strandData.title === 'Science Inquiry';

		// Process main strand
		if (
			strandData.title &&
			strandData.contentDescriptions &&
			Array.isArray(strandData.contentDescriptions)
		) {
			this.addOrUpdateLearningArea(
				learningAreas,
				strandData.title,
				strandData.contentDescriptions,
				levelInfo
			);
		}

		// Process substrands
		if (strandData.subStrands && Array.isArray(strandData.subStrands)) {
			for (const subStrand of strandData.subStrands) {
				if (
					subStrand.title &&
					subStrand.contentDescriptions &&
					Array.isArray(subStrand.contentDescriptions)
				) {
					if (isScience && strandData.title) {
						// For Science, flatten substrand standards under the main strand
						this.addOrUpdateLearningArea(
							learningAreas,
							strandData.title,
							subStrand.contentDescriptions,
							levelInfo
						);
					} else {
						// For other subjects, use substrand title as learning area name
						const learningAreaName = subStrand.title;
						this.addOrUpdateLearningArea(
							learningAreas,
							learningAreaName,
							subStrand.contentDescriptions,
							levelInfo
						);
					}
				}
			}
		}
	}

	private addOrUpdateLearningArea(
		learningAreas: LearningAreaContent[],
		areaName: string,
		contentDescriptions: any[],
		levelInfo: string
	): void {
		// Find existing learning area or create new one
		let learningArea = learningAreas.find((la) => la.name === areaName);
		if (!learningArea) {
			learningArea = {
				name: areaName,
				description: `${areaName} learning area from VCAA F-10 curriculum`,
				standards: []
			};
			learningAreas.push(learningArea);
		}

		// Add standards from content descriptions
		for (const content of contentDescriptions) {
			if (content.code && content.code.startsWith('VC2')) {
				const standard: LearningAreaStandard = {
					name: content.code,
					description:
						content.contentDescription || content.description || 'No description available',
					yearLevel: levelInfo, // Use the level info from the JSON structure instead of extracting from code
					elaborations: []
				};

				// Extract elaborations
				if (content.elaborations && Array.isArray(content.elaborations)) {
					let elaborationCounter = 1;
					for (const elaboration of content.elaborations) {
						if (elaboration.elaborationText) {
							// Clean HTML from elaboration text
							const cleanText = this.stripHtmlTags(elaboration.elaborationText);
							if (cleanText.trim()) {
								standard.elaborations.push({
									name: `Elaboration ${elaborationCounter}`,
									standardElaboration: cleanText
								});
								elaborationCounter++;
							}
						}
					}
				}

				learningArea.standards.push(standard);
			}
		}
	}

	private parseJsonCurriculumData(jsonData: any, subject: string): SubjectContent {
		try {
			// Navigate to the curriculum data structure
			const pageProps = jsonData?.props?.pageProps;
			const curriculumData = pageProps?.curriculum || pageProps?.data?.curriculum;

			if (!curriculumData) {
				return { subject: this.mapSubjectToLearningArea(subject), learningAreas: [] };
			}

			const strands = curriculumData.strands || [];

			const learningAreas: LearningAreaContent[] = [];

			for (const strand of strands) {
				const learningArea: LearningAreaContent = {
					name: strand.title || strand.name || 'Unknown',
					description: `${strand.title || strand.name} learning area from VCAA F-10 curriculum`,
					standards: []
				};

				// Extract content descriptions (standards) from the strand
				const contentDescriptions = strand.contentDescriptions || [];

				for (const content of contentDescriptions) {
					if (content.code && content.code.startsWith('VC2')) {
						const standard: LearningAreaStandard = {
							name: content.code,
							description:
								content.contentDescription || content.description || 'No description available',
							yearLevel: this.extractYearLevelFromVcaaCode(content.code),
							elaborations: []
						};

						// Extract elaborations
						if (content.elaborations && Array.isArray(content.elaborations)) {
							for (const elaboration of content.elaborations) {
								if (elaboration.elaborationText) {
									standard.elaborations.push({
										name: `Elaboration for ${content.code}`,
										standardElaboration: this.cleanDescription(elaboration.elaborationText)
									});
								}
							}
						}

						learningArea.standards.push(standard);
					}
				}

				if (learningArea.standards.length > 0) {
					learningAreas.push(learningArea);
				}
			}

			return {
				subject: this.mapSubjectToLearningArea(subject),
				learningAreas: learningAreas
			};
		} catch (error) {
			console.error('Error parsing JSON curriculum data:', error);
			return { subject: this.mapSubjectToLearningArea(subject), learningAreas: [] };
		}
	}

	private fallbackHtmlScraping($: any, subject: string): SubjectContent {
		const learningAreas: LearningAreaContent[] = [];
		const learningAreaMap = new Map<string, LearningAreaContent>();

		// Find all learning area buttons (Number, Algebra, etc.)
		const learningAreaButtons = $('button').filter((i: number, btn: any) => {
			const btnText = this.stripHtmlTags($(btn).text().trim());
			const mathLearningAreas = [
				'Number',
				'Algebra',
				'Measurement',
				'Space',
				'Statistics',
				'Probability'
			];
			const englishLearningAreas = ['Language', 'Literature', 'Literacy'];
			const scienceLearningAreas = ['Science Understanding', 'Science Inquiry Skills'];
			const hpeLearningAreas = [
				'Movement and Physical Activity',
				'Personal, Social and Community Health'
			];
			const historyLearningAreas = ['Historical Knowledge and Understanding', 'Historical Skills'];
			const geographyLearningAreas = [
				'Geographical Knowledge and Understanding',
				'Geographical Inquiry and Skills'
			];

			const allLearningAreas = [
				...mathLearningAreas,
				...englishLearningAreas,
				...scienceLearningAreas,
				...hpeLearningAreas,
				...historyLearningAreas,
				...geographyLearningAreas
			];

			return allLearningAreas.includes(btnText);
		});

		// Process each learning area button
		learningAreaButtons.each((i: number, button: any) => {
			const learningAreaName = this.stripHtmlTags($(button).text().trim());

			if (!learningAreaMap.has(learningAreaName)) {
				learningAreaMap.set(learningAreaName, {
					name: learningAreaName,
					description: `${learningAreaName} learning area from VCAA F-10 curriculum`,
					standards: []
				});
			}

			// Find the parent element that contains the content descriptions for this learning area
			const learningAreaSection = $(button).closest('div').parent();

			// Look for content descriptions within this section
			const contentDescriptions = this.extractContentDescriptionsFromSection(
				$,
				learningAreaSection,
				learningAreaName
			);

			const learningArea = learningAreaMap.get(learningAreaName)!;
			learningArea.standards.push(...contentDescriptions);
		});

		// If no learning areas found, use fallback approach
		if (learningAreaMap.size === 0) {
			const fallbackAreas = this.extractContentAlternative($, subject);
			fallbackAreas.forEach((la) => learningAreaMap.set(la.name, la));
		}

		// Convert map to array
		learningAreas.push(...Array.from(learningAreaMap.values()));

		return {
			subject: this.mapSubjectToLearningArea(subject),
			learningAreas: learningAreas
		};
	}

	private extractContentDescriptionsFromSection(
		$: any,
		sectionElement: any,
		learningAreaName: string
	): LearningAreaStandard[] {
		const standards: LearningAreaStandard[] = [];

		// Look for all VCAA codes in the entire document (they appear throughout the page structure)
		const allVcaaCodes = $('*').filter((i: number, el: any) => {
			const text = this.stripHtmlTags($(el).text().trim());
			return /^VC2[A-Z0-9]+$/.test(text);
		});

		// Filter codes that are related to this learning area based on subject patterns
		const relevantCodes = allVcaaCodes.filter((i: number, codeEl: any) => {
			const vcaaCode = this.stripHtmlTags($(codeEl).text().trim());

			// Check if this code is relevant to the current learning area
			// For mathematics: VC2MFAN01 (FoUndation Number), VC2M1N01 (Level 1 Number), etc.
			const isRelevantToLearningArea = this.isCodeRelevantToLearningArea(
				vcaaCode,
				learningAreaName
			);

			// Also check if the code appears near the learning area button
			const distanceFromButton = this.getDistanceFromLearningAreaContext(
				$(codeEl),
				learningAreaName,
				$
			);

			return isRelevantToLearningArea && distanceFromButton < 1000; // Reasonable proximity
		});

		relevantCodes.each((i: number, codeElement: any) => {
			const vcaaCode = this.stripHtmlTags($(codeElement).text().trim());

			// Find the description associated with this code
			// The description usually appears as text before the VCAA code
			const description = this.findDescriptionForCode($, $(codeElement), vcaaCode);

			if (description && description.length > 10) {
				// Extract year level from the VCAA code
				const yearLevel = this.extractYearLevelFromVcaaCode(vcaaCode);

				// Extract elaborations if available
				const elaborations = this.extractElaborationsForStandard($, vcaaCode, $(codeElement));

				const standard: LearningAreaStandard = {
					name: vcaaCode,
					description: description,
					yearLevel: yearLevel,
					elaborations: elaborations
				};

				standards.push(standard);
			}
		});

		return standards;
	}

	private isCodeRelevantToLearningArea(vcaaCode: string, learningAreaName: string): boolean {
		// Mathematics codes: VC2M[Foundation/Level][Learning Area][Number]
		// Foundation Level A Number: VC2MFAN01
		// Level 1 Number: VC2M1N01
		// Level 7 Algebra: VC2M7A01

		const learningAreaMapping: { [key: string]: string[] } = {
			Number: ['N', 'FAN', 'FBN', 'FCN', 'FDN', 'FN'],
			Algebra: ['A', 'FAA', 'FBA', 'FCA', 'FDA', 'FA'],
			Measurement: ['M', 'FAM', 'FBM', 'FCM', 'FDM', 'FM'],
			Space: ['SP', 'FASP', 'FBSP', 'FCSP', 'FDSP', 'FSP'],
			Statistics: ['ST', 'FCST', 'FDST', 'FST'],
			Probability: ['P']
		};

		const codes = learningAreaMapping[learningAreaName] || [];

		return codes.some((code) => {
			// Check if the VCAA code contains the learning area code
			return vcaaCode.includes(code);
		});
	}

	private getDistanceFromLearningAreaContext(
		codeElement: any,
		learningAreaName: string,
		$: any
	): number {
		// Find the nearest learning area button/header
		const learningAreaButton = $('button')
			.filter((i: number, btn: any) => {
				const btnText = this.stripHtmlTags($(btn).text().trim());
				return btnText === learningAreaName;
			})
			.first();

		if (learningAreaButton.length === 0) {
			return 999; // High distance if no button found
		}

		// Calculate approximate distance in DOM structure
		const codePos = codeElement.index();
		const buttonPos = learningAreaButton.index();

		return Math.abs(codePos - buttonPos);
	}

	private findDescriptionForCode($: any, codeElement: any, vcaaCode: string): string {
		// Strategy 1: Look for text content immediately before the VCAA code
		let description = '';

		// Look at previous siblings for description text
		const prevSiblings = codeElement.prevAll();
		for (let i = 0; i < Math.min(3, prevSiblings.length); i++) {
			const siblingText = this.stripHtmlTags($(prevSiblings[i]).text().trim());
			if (
				siblingText.length > 20 &&
				!siblingText.includes('ELABORATIONS') &&
				!siblingText.includes('COPY') &&
				!siblingText.includes('Students learn to:') &&
				!siblingText.includes('Students:') &&
				!siblingText.match(/^VC2[A-Z0-9]+$/)
			) {
				description = siblingText;
				break;
			}
		}

		// Strategy 2: Look at parent element's text
		if (!description) {
			const parentText = this.stripHtmlTags(codeElement.parent().text().trim());
			// Extract text that appears before the VCAA code
			const codeIndex = parentText.indexOf(vcaaCode);
			if (codeIndex > 0) {
				const beforeCode = parentText.substring(0, codeIndex).trim();
				if (beforeCode.length > 20) {
					description = beforeCode;
				}
			}
		}

		// Strategy 3: Look in the broader container
		if (!description) {
			const container = codeElement.closest('div');
			const containerText = this.stripHtmlTags(container.text());
			const parts = containerText.split(vcaaCode);
			if (parts.length > 1 && parts[0].trim().length > 20) {
				// Take the last reasonable sentence before the code
				const sentences = parts[0].trim().split(/[.!?]+/);
				const lastSentence = sentences[sentences.length - 1].trim();
				if (lastSentence.length > 20) {
					description = lastSentence;
				}
			}
		}

		return this.cleanDescription(description);
	}

	private cleanDescription(description: string): string {
		if (!description) return '';

		// Remove common prefixes/suffixes
		description = description.replace(/^(Students learn to:|Students:)\s*/i, '');
		description = description.replace(/\s*(ELABORATIONS|COPY).*$/i, '');

		return description.trim();
	}

	private extractYearLevelFromVcaaCode(vcaaCode: string): string {
		// Extract year level from VCAA code format
		// VC2MFAN01 = Foundation Level A
		// VC2M1N01 = Level 1
		// VC2M10N01 = Level 10

		if (vcaaCode.includes('MFA')) return 'Foundation Level A';
		if (vcaaCode.includes('MFB')) return 'Foundation Level B';
		if (vcaaCode.includes('MFC')) return 'Foundation Level C';
		if (vcaaCode.includes('MFD')) return 'Foundation Level D';
		if (
			vcaaCode.includes('MF') &&
			!vcaaCode.includes('MFA') &&
			!vcaaCode.includes('MFB') &&
			!vcaaCode.includes('MFC') &&
			!vcaaCode.includes('MFD')
		)
			return 'Foundation';

		// Extract numeric level
		const levelMatch = vcaaCode.match(/VC2M(\d+)/);
		if (levelMatch) {
			const level = levelMatch[1];
			if (level === '10') {
				// Check for Level 10A
				if (vcaaCode.includes('10A')) return 'Level 10A';
				return 'Level 10';
			}
			return `Level ${level}`;
		}

		return 'Foundation'; // Default fallback
	}

	private extractElaborationsForStandard(
		$: any,
		vcaaCode: string,
		codeElement: any
	): StandardElaboration[] {
		const elaborations: StandardElaboration[] = [];

		// Look for ELABORATIONS text/link near the VCAA code
		const elaborationsLink = codeElement
			.nextAll()
			.filter((i: number, el: any) => {
				const text = this.stripHtmlTags($(el).text().trim());
				return text.includes('ELABORATIONS');
			})
			.first();

		if (elaborationsLink.length > 0) {
			// For the current page structure, elaborations are typically shown when clicked
			// We'll need to make a separate request to get the full elaborations
			// For now, we'll extract any visible elaboration content in the area

			const elaborationContainer = elaborationsLink.parent().parent();
			const elaborationTexts = elaborationContainer.find('p, li').filter((i: number, el: any) => {
				const text = this.stripHtmlTags($(el).text().trim());
				return (
					text.length > 30 &&
					!text.includes('ELABORATIONS') &&
					!text.includes('COPY') &&
					!text.includes(vcaaCode)
				);
			});

			// If we found elaboration texts in the container
			if (elaborationTexts.length > 0) {
				elaborationTexts.each((i: number, el: any) => {
					const elaborationText = this.stripHtmlTags($(el).text().trim());
					if (elaborationText.length > 20) {
						elaborations.push({
							name: `Elaboration ${i + 1}`,
							standardElaboration: elaborationText
						});
					}
				});
			} else {
				// Create placeholder elaborations based on what we expect to find
				// This would need to be fetched by making additional requests to the specific standard URLs
				elaborations.push({
					name: `${vcaaCode} Implementation Examples`,
					standardElaboration: `Implementation examples and detailed elaborations for ${vcaaCode} would be available by clicking the ELABORATIONS link on the VCAA website.`
				});
			}
		}

		return elaborations;
	}

	private extractContentNearElement($: any, buttonElement: any): LearningAreaStandard[] {
		const standards: LearningAreaStandard[] = [];

		// Look for content in the surrounding container
		const container = buttonElement.closest('div').parent();

		// Find text content that looks like standards
		const textElements = container.find('p, div').filter((i: number, el: any) => {
			const text = this.stripHtmlTags($(el).text().trim());
			return (
				text.length > 30 && // Substantial content
				!text.includes('Show more') &&
				!text.includes('COPY') &&
				!text.includes('elaboration')
			);
		});

		textElements.each((i: number, element: any) => {
			const fullText = this.stripHtmlTags($(element).text().trim());

			if (fullText && fullText.length > 30) {
				// Try to extract VCAA code if present
				const codeMatch = fullText.match(
					/\b(AC2[A-Z]+\d+[A-Z]*\d*|VC2[A-Z]+\d+[A-Z]*\d*|[A-Z]{2,}[A-Z0-9]+)\b/
				);
				const vcaaCode = codeMatch ? codeMatch[1] : `STANDARD_${Date.now()}_${i}`;

				// Clean description
				const description = codeMatch ? fullText.replace(codeMatch[0], '').trim() : fullText;

				if (description && description.length > 10) {
					const yearLevel = this.extractYearLevelFromContext($, $(element));

					const standard: LearningAreaStandard = {
						name: vcaaCode,
						description: description,
						yearLevel: yearLevel,
						elaborations: []
					};

					standards.push(standard);
				}
			}
		});

		return standards;
	}

	private extractContentAlternative($: any, subject: string): LearningAreaContent[] {
		const learningAreas: LearningAreaContent[] = [];

		// Create default learning areas based on subject
		const subjectLearningAreas = this.getSubjectLearningAreas(subject);

		// Look for any substantial text content that could be standards
		const allTextElements = $('p, div').filter((i: number, el: any) => {
			const text = this.stripHtmlTags($(el).text().trim());
			return (
				text.length > 50 && // Substantial content
				!text.includes('Copyright') &&
				!text.includes('Privacy') &&
				!text.includes('Victorian Curriculum') &&
				!text.includes('Skip to')
			);
		});

		subjectLearningAreas.forEach((learningAreaName, index) => {
			const learningArea: LearningAreaContent = {
				name: learningAreaName,
				description: `${learningAreaName} learning area from VCAA F-10 curriculum`,
				standards: []
			};

			// Take a subset of text elements for this learning area
			const startIndex = Math.floor((allTextElements.length / subjectLearningAreas.length) * index);
			const endIndex = Math.floor(
				(allTextElements.length / subjectLearningAreas.length) * (index + 1)
			);

			for (let i = startIndex; i < Math.min(endIndex, startIndex + 5); i++) {
				const element = allTextElements.eq(i);
				const fullText = this.stripHtmlTags(element.text().trim());

				if (fullText && fullText.length > 30) {
					const vcaaCode = `${learningAreaName.substring(0, 2).toUpperCase()}${String(i).padStart(3, '0')}`;
					const yearLevel = this.extractYearLevelFromContext($, element);

					const standard: LearningAreaStandard = {
						name: vcaaCode,
						description: fullText.substring(0, 200) + (fullText.length > 200 ? '...' : ''),
						yearLevel: yearLevel,
						elaborations: []
					};

					learningArea.standards.push(standard);
				}
			}

			if (learningArea.standards.length > 0) {
				learningAreas.push(learningArea);
			}
		});

		return learningAreas;
	}

	private getSubjectLearningAreas(subject: string): string[] {
		const learningAreaMap: { [key: string]: string[] } = {
			mathematics: ['Number', 'Algebra', 'Measurement', 'Space', 'Statistics', 'Probability'],
			english: ['Language', 'Literature', 'Literacy'],
			science: ['Science Understanding', 'Science Inquiry Skills'],
			'health-and-physical-education': [
				'Movement and Physical Activity',
				'Personal, Social and Community Health'
			],
			history: ['Historical Knowledge and Understanding', 'Historical Skills'],
			geography: ['Geographical Knowledge and Understanding', 'Geographical Inquiry and Skills'],
			'design-and-technologies': [
				'Design and Technologies Knowledge and Understanding',
				'Design and Technologies Skills'
			],
			'digital-technologies': [
				'Digital Technologies Knowledge and Understanding',
				'Digital Technologies Skills'
			]
		};

		return learningAreaMap[subject.toLowerCase()] || ['General'];
	}

	private findContentDescriptionSections($: any): Array<{ yearLevels: string[]; element: any }> {
		const sections: Array<{ yearLevels: string[]; element: any }> = [];

		// Look for tab headers or level indicators
		const levelHeaders = $('h1, h2, h3, h4, h5, h6').filter((i: number, el: any) => {
			const text = $(el).text().trim();
			return (
				text.includes('Foundation') ||
				text.includes('Level') ||
				text.includes('Levels') ||
				text.match(/\d+/)
			);
		});

		levelHeaders.each((i: number, header: any) => {
			const headerText = $(header).text().trim();
			const yearLevels = this.extractYearLevelsFromHeader(headerText);

			if (yearLevels.length > 0) {
				// Find the content section following this header
				let contentElement = $(header).next();
				while (contentElement.length && !contentElement.text().trim()) {
					contentElement = contentElement.next();
				}

				if (contentElement.length) {
					sections.push({
						yearLevels: yearLevels,
						element: contentElement
					});
				}
			}
		});

		// If no specific sections found, create a default one
		if (sections.length === 0) {
			sections.push({
				yearLevels: ['Foundation'],
				element: $('body')
			});
		}

		return sections;
	}

	private extractYearLevelsFromHeader(headerText: string): string[] {
		const levelMappings = [
			{ pattern: /Foundation to Level 2|F–2|F-2/, levels: ['Foundation', 'Year 1', 'Year 2'] },
			{ pattern: /Levels 1 and 2|1–2|1-2/, levels: ['Year 1', 'Year 2'] },
			{ pattern: /Levels 3 and 4|3–4|3-4/, levels: ['Year 3', 'Year 4'] },
			{ pattern: /Levels 5 and 6|5–6|5-6/, levels: ['Year 5', 'Year 6'] },
			{ pattern: /Levels 7 and 8|7–8|7-8/, levels: ['Year 7', 'Year 8'] },
			{ pattern: /Levels 9 and 10|9–10|9-10/, levels: ['Year 9', 'Year 10'] },
			{ pattern: /Foundation Level [A-D]|Foundation/, levels: ['Foundation'] },
			{ pattern: /Level (\d+)/, levels: [] } // Will be handled below
		];

		for (const mapping of levelMappings) {
			const match = headerText.match(mapping.pattern);
			if (match) {
				if (mapping.levels.length > 0) {
					return mapping.levels;
				} else if (match[1]) {
					// Handle individual levels
					return [`Year ${match[1]}`];
				}
			}
		}

		return ['Foundation']; // Default fallback
	}

	private findStandardsAfterElement($: any, learningAreaEl: any): any[] {
		const standards: any[] = [];

		// Look for standards in the container following the learning area button
		const currentElement = learningAreaEl.parent();

		// Search through siblings and children for standard elements
		const possibleStandards = currentElement.find(
			'.bg-white.p-3.mb-3, div:has(.text-vcaaTextGrey)'
		);

		possibleStandards.each((i: number, el: any) => {
			const $el = $(el);
			const hasDescription = $el.find('p').length > 0;
			const hasCode = $el.find('.text-vcaaTextGrey').length > 0;

			if (hasDescription && hasCode) {
				standards.push($el);
			}
		});

		return standards;
	}

	private extractYearLevelFromContext($: any, element: any): string {
		// Look for year level indicators in the page structure
		// Check for level tabs or headings
		const levelIndicators = [
			'Foundation Level A',
			'Foundation Level B',
			'Foundation Level C',
			'Foundation Level D',
			'Foundation',
			'Level 1',
			'Level 2',
			'Level 3',
			'Level 4',
			'Level 5',
			'Level 6',
			'Level 7',
			'Level 8',
			'Level 9',
			'Level 10',
			'Level 10A'
		];

		// Find the closest section header or tab
		let currentElement = element.closest('div');
		for (let i = 0; i < 10; i++) {
			// Limit search depth
			const headings = currentElement.find('h1, h2, h3, h4, h5, h6');
			for (let j = 0; j < headings.length; j++) {
				const headingText = $(headings[j]).text().trim();
				for (const indicator of levelIndicators) {
					if (headingText.includes(indicator)) {
						return this.mapLevelToYearLevel(indicator);
					}
				}
			}
			currentElement = currentElement.parent();
			if (currentElement.length === 0) break;
		}

		// Default fallback
		return 'Foundation';
	}

	private mapLevelToYearLevel(levelText: string): string {
		const mapping: { [key: string]: string } = {
			'Foundation Level A': 'Foundation',
			'Foundation Level B': 'Foundation',
			'Foundation Level C': 'Foundation',
			'Foundation Level D': 'Foundation',
			Foundation: 'Foundation',
			'Level 1': 'Year 1',
			'Level 2': 'Year 2',
			'Level 3': 'Year 3',
			'Level 4': 'Year 4',
			'Level 5': 'Year 5',
			'Level 6': 'Year 6',
			'Level 7': 'Year 7',
			'Level 8': 'Year 8',
			'Level 9': 'Year 9',
			'Level 10': 'Year 10',
			'Level 10A': 'Year 10'
		};

		return mapping[levelText] || 'Foundation';
	}

	private determineYearLevelsFromContext($: any, standardElement: any): string[] {
		// Look for year level indicators in the page structure
		// Check for level tabs or headings
		const levelIndicators = [
			'Foundation to Level 2',
			'Foundation',
			'F–2',
			'F-2',
			'Levels 1 and 2',
			'1–2',
			'1-2',
			'Levels 3 and 4',
			'3–4',
			'3-4',
			'Levels 5 and 6',
			'5–6',
			'5-6',
			'Levels 7 and 8',
			'7–8',
			'7-8',
			'Levels 9 and 10',
			'9–10',
			'9-10',
			'Foundation Level A',
			'Foundation Level B',
			'Foundation Level C',
			'Foundation Level D',
			'Level 1',
			'Level 2',
			'Level 3',
			'Level 4',
			'Level 5',
			'Level 6',
			'Level 7',
			'Level 8',
			'Level 9',
			'Level 10'
		];

		// Find the closest section header or tab
		let currentElement = standardElement.closest('div');
		for (let i = 0; i < 10; i++) {
			// Limit search depth
			const headings = currentElement.find('h1, h2, h3, h4, h5, h6');
			for (let j = 0; j < headings.length; j++) {
				const headingText = $(headings[j]).text().trim();
				for (const indicator of levelIndicators) {
					if (headingText.includes(indicator)) {
						return this.mapLevelIdToYearLevel(indicator);
					}
				}
			}
			currentElement = currentElement.parent();
			if (currentElement.length === 0) break;
		}

		// Default fallback - try to infer from page structure
		return ['Foundation'];
	}

	private async fetchElaborationsForStandard(
		vcaaCode: string,
		subject: string
	): Promise<StandardElaboration[]> {
		try {
			const urlPath = this.getSubjectUrlPath(subject);
			const url = `${this.baseUrl}${urlPath}#${vcaaCode}`;

			const html = await this.fetchPage(url);
			const $ = cheerio.load(html);

			const elaborations: StandardElaboration[] = [];

			// Look for elaboration content in the page
			const elaborationLists = $('ul li p, div.my-2 ul li p');

			elaborationLists.each((i: number, el: any) => {
				const elaborationText = this.stripHtmlTags($(el).text().trim());
				if (elaborationText && elaborationText.length > 0) {
					// Extract name from first few words or use a generic name
					const name = elaborationText.split(' ').slice(0, 5).join(' ');
					elaborations.push({
						name: name,
						standardElaboration: elaborationText
					});
				}
			});

			return elaborations;
		} catch (error) {
			console.warn(`Failed to fetch elaborations for ${vcaaCode}:`, error);
			return [];
		}
	}

	private getSubjectUrlPath(subject: string): string {
		const urlPatterns: { [key: string]: string } = {
			// Core subjects
			mathematics: '/learning-areas/mathematics/curriculum',
			english: '/learning-areas/english/english/curriculum',
			science: '/learning-areas/science/curriculum',

			// Technologies
			'design-and-technologies': '/learning-areas/technologies/design-and-technologies/curriculum',
			'digital-technologies': '/learning-areas/technologies/digital-technologies/curriculum',

			// Humanities
			'civics-and-citizenship': '/learning-areas/humanities/civics-and-citizenship/curriculum',
			'economics-and-business': '/learning-areas/humanities/economics-and-business/curriculum',
			geography: '/learning-areas/humanities/geography/curriculum',
			history: '/learning-areas/humanities/history/curriculum',

			// Health & Physical Education
			'health-and-physical-education': '/learning-areas/health-and-physical-education/curriculum',

			// The Arts
			dance: '/learning-areas/the-arts/dance/curriculum',
			drama: '/learning-areas/the-arts/drama/curriculum',
			'media-arts': '/learning-areas/the-arts/media-arts/curriculum',
			music: '/learning-areas/the-arts/music/curriculum',
			'visual-arts': '/learning-areas/the-arts/visual-arts/curriculum',
			'visual-communication-design':
				'/learning-areas/the-arts/visual-communication-design/curriculum'
		};

		return urlPatterns[subject.toLowerCase()] || '/learning-areas/' + subject + '/curriculum';
	}

	private extractElaborations(elaborationsArray: any[]): string[] {
		if (!Array.isArray(elaborationsArray)) {
			return [];
		}

		return elaborationsArray
			.map((elab) => {
				let text = '';
				if (typeof elab === 'string') {
					text = elab;
				} else if (elab && elab.elaborationText) {
					text = elab.elaborationText;
				} else {
					return null;
				}

				// Strip HTML tags and clean up the text
				return this.stripHtmlTags(text);
			})
			.filter((text) => text && text.length > 0) as string[];
	}

	private mapLevelIdToYearLevel(levelId: string): string[] {
		// Handle ranges and return all year levels in the range
		const rangeMapping: { [key: string]: string[] } = {
			'F-2': ['Foundation', 'Year 1', 'Year 2'],
			'F–2': ['Foundation', 'Year 1', 'Year 2'],
			'1–2': ['Year 1', 'Year 2'],
			'1-2': ['Year 1', 'Year 2'],
			'3-4': ['Year 3', 'Year 4'],
			'3–4': ['Year 3', 'Year 4'],
			'5–6': ['Year 5', 'Year 6'],
			'5-6': ['Year 5', 'Year 6'],
			'7–8': ['Year 7', 'Year 8'],
			'7-8': ['Year 7', 'Year 8'],
			'9–10': ['Year 9', 'Year 10'],
			'9-10': ['Year 9', 'Year 10']
		};

		// Check if it's a range first
		if (rangeMapping[levelId]) {
			return rangeMapping[levelId];
		}

		// Handle individual year levels
		const singleMapping: { [key: string]: string } = {
			FLA: 'Foundation',
			FLB: 'Foundation',
			FLC: 'Foundation',
			FLD: 'Foundation',
			F: 'Foundation',
			'1': 'Year 1',
			'2': 'Year 2',
			'3': 'Year 3',
			'4': 'Year 4',
			'5': 'Year 5',
			'6': 'Year 6',
			'7': 'Year 7',
			'8': 'Year 8',
			'9': 'Year 9',
			'10': 'Year 10',
			'10A': 'Year 10'
		};

		const mapped = singleMapping[levelId] || levelId;
		return [mapped];
	}

	private mapSubjectToLearningArea(subject: string): string {
		const mapping: { [key: string]: string } = {
			// Core subjects
			mathematics: 'Mathematics',
			english: 'English',
			science: 'Science',

			// Technologies - use individual names
			'design-and-technologies': 'Design and Technologies',
			'digital-technologies': 'Digital Technologies',

			// Humanities - keep together
			'civics-and-citizenship': 'Humanities',
			'economics-and-business': 'Humanities',
			geography: 'Humanities',
			history: 'Humanities',

			// Health & Physical Education
			'health-and-physical-education': 'Health and Physical Education',

			// Languages - use individual names
			chinese: 'Chinese',
			'chinese-f10': 'Chinese',
			'chinese-710': 'Chinese',
			french: 'French',
			'french-f10': 'French',
			'french-710': 'French',
			german: 'German',
			'german-f10': 'German',
			'german-710': 'German',
			indonesian: 'Indonesian',
			'indonesian-f10': 'Indonesian',
			'indonesian-710': 'Indonesian',
			italian: 'Italian',
			'italian-f10': 'Italian',
			'italian-710': 'Italian',
			japanese: 'Japanese',
			'japanese-f10': 'Japanese',
			'japanese-710': 'Japanese',
			korean: 'Korean',
			'korean-f10': 'Korean',
			'korean-710': 'Korean',
			'modern-greek': 'Modern Greek',
			'modern-greek-f10': 'Modern Greek',
			'modern-greek-710': 'Modern Greek',
			spanish: 'Spanish',
			'spanish-f10': 'Spanish',
			'spanish-710': 'Spanish',

			// Arts - use individual names
			dance: 'Dance',
			drama: 'Drama',
			'media-arts': 'Media Arts',
			music: 'Music',
			'visual-arts': 'Visual Arts',
			'visual-communication-design': 'Visual Communication Design'
		};

		return mapping[subject.toLowerCase()] || 'General';
	}

	async scrapeSubject(subject: string): Promise<SubjectContent> {
		try {
			// Try the new JSON API approach first
			return await this.fetchCurriculumFromJsonApi(subject);
		} catch (error) {
			console.warn(`Failed to scrape subject ${subject}:`, error);
			return {
				subject: this.mapSubjectToLearningArea(subject),
				learningAreas: []
			};
		}
	}

	/**
	 * Scrape multiple subjects and return JSON data
	 */
	async scrapeSubjects(subjects: string[]): Promise<SubjectContent[]> {
		const results: SubjectContent[] = [];

		for (const subject of subjects) {
			try {
				const subjectContent = await this.scrapeSubject(subject);
				results.push(subjectContent);
			} catch (error) {
				console.error(`Failed to scrape ${subject}:`, error);
			}
		}

		return results;
	}

	/**
	 * Scrape all F-10 subjects and return JSON data
	 */
	async scrapeAllSubjects(): Promise<SubjectContent[]> {
		const allSubjects = [
			// Core subjects
			'mathematics',
			'english',
			'science',
			'health-and-physical-education',

			// Technologies
			'design-and-technologies',
			'digital-technologies',

			// Humanities
			'civics-and-citizenship',
			'economics-and-business',
			'geography',
			'history',

			// The Arts
			'dance',
			'drama',
			'media-arts',
			'music',
			'visual-arts',
			'visual-communication-design'
		];

		return await this.scrapeSubjects(allSubjects);
	}

	/**
	 * Convert VCAA year level to individual year levels
	 */
	parseYearLevel(yearLevel: string): string[] {
		// Normalize the input - remove "Year " prefix and extra spaces
		const normalized = yearLevel.replace(/^Year\s+/i, '').trim();

		// Handle Foundation year
		if (normalized.toLowerCase() === 'foundation') {
			return ['F'];
		}

		// Handle ranges like "9–10"
		if (normalized.includes('–') || normalized.includes('-')) {
			const separator = normalized.includes('–') ? '–' : '-';
			const [start, end] = normalized.split(separator);

			// Handle Foundation ranges like "F-2"
			if (start.toLowerCase() === 'f') {
				const result = ['F'];
				const endNum = parseInt(end, 10);
				for (let i = 1; i <= endNum; i++) {
					result.push(i.toString());
				}
				return result;
			}

			// Handle numeric ranges
			const startNum = parseInt(start, 10);
			const endNum = parseInt(end, 10);
			const result = [];
			for (let i = startNum; i <= endNum; i++) {
				result.push(i.toString());
			}
			return result;
		}

		// Handle individual year levels
		return [normalized];
	}

	/**
	 * Scrape core subjects for F-10 curriculum
	 */
	async scrapeCoreSubjects(): Promise<SubjectContent[]> {
		const coreSubjects = ['mathematics', 'english', 'science', 'health-and-physical-education'];
		return await this.scrapeSubjects(coreSubjects);
	}

	/**
	 * Convert new format to legacy ContentItem format for backward compatibility
	 */
	convertToLegacyFormat(subjectContents: SubjectContent[]): ContentItem[] {
		const contentItems: ContentItem[] = [];

		subjectContents.forEach((subjectContent) => {
			subjectContent.learningAreas.forEach((learningArea) => {
				learningArea.standards.forEach((standard) => {
					const elaborations = standard.elaborations.map((elab) => elab.standardElaboration);

					const contentItem: ContentItem = {
						learningArea: learningArea.name,
						yearLevel: standard.yearLevel,
						vcaaCode: standard.name,
						description: standard.description,
						elaborations: elaborations,
						strand: subjectContent.subject
					};

					contentItems.push(contentItem);
				});
			});
		});

		return contentItems;
	}

	private stripHtmlTags(text: string): string {
		// Remove HTML tags and decode HTML entities
		return text
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
			.replace(/&amp;/g, '&') // Replace HTML entities
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, ' ') // Replace multiple whitespace with single space
			.trim(); // Remove leading/trailing whitespace
	}

	/**
	 * Export scraped data to JSON
	 */
	async exportToJson(subjects: string[], outputPath?: string): Promise<string> {
		const data = await this.scrapeSubjects(subjects);
		const jsonData = JSON.stringify(data, null, 2);

		if (outputPath) {
			const fs = await import('fs/promises');
			await fs.writeFile(outputPath, jsonData, 'utf-8');
		}

		return jsonData;
	}

	/**
	 * Export all F-10 curriculum data to JSON
	 */
	async exportAllToJson(outputPath?: string): Promise<string> {
		const data = await this.scrapeAllSubjects();
		const jsonData = JSON.stringify(data, null, 2);

		if (outputPath) {
			const fs = await import('fs/promises');
			await fs.writeFile(outputPath, jsonData, 'utf-8');
		}

		return jsonData;
	}
}
