#!/usr/bin/env node

/**
 * Script to generate VCAA curriculum JSON data using the scraper
 * Run this script to update the curriculum data when VCAA updates their content
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { VCAAF10Scraper } from './index';
import type { VCAACurriculumData, VCAASubject } from './types';

const SUBJECTS_TO_SCRAPE = [
	{
		name: 'Mathematics',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/mathematics/introduction/rationale-and-aims'
	},
	{
		name: 'English',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/english/introduction/rationale-and-aims'
	},
	{
		name: 'Science',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/science/introduction/rationale-and-aims'
	},
	{
		name: 'History',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/humanities/history/introduction/rationale-and-aims'
	},
	{
		name: 'Geography',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/humanities/geography/introduction/rationale-and-aims'
	},
	{
		name: 'Civics and Citizenship',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/humanities/civics-and-citizenship/introduction/rationale-and-aims'
	},
	{
		name: 'Economics and Business',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/humanities/economics-and-business/introduction/rationale-and-aims'
	},
	{
		name: 'Health and Physical Education',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/health-and-physical-education/introduction/rationale-and-aims'
	},
	{
		name: 'Design and Technologies',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/technologies/design-and-technologies/introduction/rationale-and-aims'
	},
	{
		name: 'Digital Technologies',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/technologies/digital-technologies/introduction/rationale-and-aims'
	},
	{
		name: 'Dance',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/the-arts/dance/introduction/rationale-and-aims'
	},
	{
		name: 'Drama',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/the-arts/drama/introduction/rationale-and-aims'
	},
	{
		name: 'Media Arts',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/the-arts/media-arts/introduction/rationale-and-aims'
	},
	{
		name: 'Music',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/the-arts/music/introduction/rationale-and-aims'
	},
	{
		name: 'Visual Arts',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/the-arts/visual-arts/introduction/rationale-and-aims'
	},
	{
		name: 'Visual Communication Design',
		url: 'https://victoriancurriculum.vcaa.vic.edu.au/the-arts/visual-communication-design/introduction/rationale-and-aims'
	}
];

async function generateCurriculumData(): Promise<void> {
	const scraper = new VCAAF10Scraper();
	const subjects: VCAASubject[] = [];

	for (const subjectInfo of SUBJECTS_TO_SCRAPE) {
		try {
			const subjectContent = await scraper.scrapeSubject(subjectInfo.name);

			if (subjectContent) {
				// Transform the scraped content to match our JSON structure
				const learningAreaMap = new Map<
					string,
					{
						name: string;
						description: string;
						standards: Array<{
							name: string;
							description: string;
							yearLevel: string;
							elaborations: string[];
						}>;
					}
				>();

				// Group content by learning area
				subjectContent.learningAreas.forEach((la) => {
					if (!learningAreaMap.has(la.name)) {
						learningAreaMap.set(la.name, {
							name: la.name,
							description: la.description || '',
							standards: []
						});
					}

					la.standards.forEach((standard) => {
						learningAreaMap.get(la.name)!.standards.push({
							name: standard.name,
							description: standard.description,
							yearLevel: standard.yearLevel,
							elaborations: standard.elaborations.map((elab) => elab.standardElaboration)
						});
					});
				});

				const subject: VCAASubject = {
					name: subjectInfo.name,
					url: subjectInfo.url,
					learningAreas: Array.from(learningAreaMap.values())
				};

				subjects.push(subject);
			} else {
				console.error(`⚠️ No content found for ${subjectInfo.name}`);
			}
		} catch (error) {
			console.error(`❌ Error scraping ${subjectInfo.name}:`, error);
		}
	}

	// Create the final data structure
	const curriculumData: VCAACurriculumData = {
		scrapedAt: new Date().toISOString(),
		subjects
	};

	// Write to JSON file
	const outputPath = join(new URL('.', import.meta.url).pathname, 'vcaa-curriculum.json');
	writeFileSync(outputPath, JSON.stringify(curriculumData, null, 2), 'utf-8');
}

// Run the script
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
	generateCurriculumData().catch(console.error);
}

export { generateCurriculumData };
