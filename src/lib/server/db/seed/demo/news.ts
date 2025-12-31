import { newsPriorityEnum, newsStatusEnum, newsVisibilityEnum } from '$lib/enums';
import * as schema from '../../schema';
import type { Database } from '../types';
import type { DemoSchoolData, DemoUserData } from './types';

export async function seedDemoNews(
    db: Database,
    schoolData: DemoSchoolData,
    userData: DemoUserData
): Promise<void> {
    const { school, campus } = schoolData;
    const { admin, teachers } = userData;

    // Create news categories
    const newsCategories = await db
        .insert(schema.newsCategory)
        .values([
            {
                name: 'School Announcements',
                description: 'General school announcements and updates',
                color: '#3B82F6', // Blue
                isArchived: false
            },
            {
                name: 'Academic News',
                description: 'Academic achievements and educational updates',
                color: '#10B981', // Green
                isArchived: false
            },
            {
                name: 'Sports & Activities',
                description: 'Sports events, extracurricular activities, and student achievements',
                color: '#F59E0B', // Orange
                isArchived: false
            },
            {
                name: 'Community Events',
                description: 'Community involvement and special events',
                color: '#8B5CF6', // Purple
                isArchived: false
            }
        ])
        .returning();

    console.log(`  Created ${newsCategories.length} news categories`);

    // Create news articles
    await db.insert(schema.news).values([
        {
            title: 'Welcome Back to School Year 2025',
            excerpt: `We are excited to welcome all students, teachers, and families back for another fantastic year at ${school.name}.`,
            content: {
                blocks: [
                    { type: 'paragraph', content: `Dear ${school.name} Community,` },
                    {
                        type: 'paragraph',
                        content: `We are thrilled to welcome everyone back to ${school.name} for the 2025 academic year! After a wonderful summer break, our campus is buzzing with excitement as students return to their classrooms and teachers prepare for another year of inspiring education.`
                    },
                    {
                        type: 'paragraph',
                        content: 'This year, we have some exciting new initiatives planned, including enhanced STEM programs, updated library resources, and improved playground facilities. Our dedicated teaching staff has been working hard during the break to prepare engaging lessons and activities for all year levels.'
                    },
                    { type: 'paragraph', content: 'Important reminders for the start of term:' },
                    {
                        type: 'list',
                        items: [
                            'School starts at 8:00 AM sharp',
                            'Please ensure students bring their water bottles daily',
                            'Uniform requirements are strictly enforced',
                            'Parent-teacher meetings will be scheduled in Week 3'
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: "We look forward to working together to make 2025 a successful and memorable year for all our students. If you have any questions or concerns, please don't hesitate to contact the school office."
                    },
                    { type: 'paragraph', content: 'Warm regards,<br>School Administration Team' }
                ]
            },
            schoolId: school.id,
            campusId: campus.id,
            categoryId: newsCategories[0].id,
            authorId: admin.id,
            status: newsStatusEnum.published,
            priority: newsPriorityEnum.high,
            visibility: newsVisibilityEnum.public,
            publishedAt: new Date(),
            isPinned: true,
            viewCount: 0,
            isArchived: false
        },
        {
            title: 'Year 9 Science Fair Competition Results',
            excerpt: "Congratulations to all Year 9 students who participated in our annual Science Fair. Outstanding projects showcased creativity and scientific thinking across multiple disciplines.",
            content: {
                blocks: [
                    {
                        type: 'paragraph',
                        content: 'We are proud to announce the results of our annual Year 9 Science Fair, which took place last Friday in the school gymnasium.'
                    },
                    {
                        type: 'paragraph',
                        content: 'This year\'s theme was "Sustainability and Innovation," and our students rose to the challenge with incredible projects that demonstrated both scientific rigor and creative problem-solving.'
                    },
                    { type: 'heading', level: 3, content: 'Prize Winners:' },
                    {
                        type: 'list',
                        items: [
                            '1st Place: "Solar-Powered Water Filtration System" by Student One',
                            '2nd Place: "Biodegradable Plastic from Orange Peels" by Student Two',
                            '3rd Place: "Wind Energy Generation Model" by Student Three',
                            'People\'s Choice Award: "Sustainable Garden Ecosystem" by various students'
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: 'All participants should be proud of their efforts. The projects will be on display in the Science Lab A for the next two weeks.'
                    }
                ]
            },
            schoolId: school.id,
            campusId: campus.id,
            categoryId: newsCategories[1].id,
            authorId: teachers[2].id, // Science Teacher
            status: newsStatusEnum.published,
            priority: newsPriorityEnum.normal,
            visibility: newsVisibilityEnum.public,
            publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            isPinned: false,
            viewCount: 15,
            isArchived: false
        },
        {
            title: 'Basketball Team Wins Regional Championship',
            excerpt: 'Our senior basketball team has achieved an incredible victory at the Regional Championships, defeating Central High School 78-65 in a thrilling final match.',
            content: {
                blocks: [
                    {
                        type: 'paragraph',
                        content: `What an amazing weekend for ${school.name} Basketball! Our senior team has brought home the Regional Championship trophy after an outstanding tournament performance.`
                    },
                    {
                        type: 'paragraph',
                        content: 'The team showed exceptional teamwork, determination, and sportsmanship throughout the three-day tournament.'
                    },
                    { type: 'heading', level: 3, content: 'Tournament Results:' },
                    {
                        type: 'list',
                        items: [
                            'Quarter-final: def. Westside Academy 65-58',
                            'Semi-final: def. Northshore College 71-62',
                            'Final: def. Central High School 78-65'
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: 'The team will now advance to the State Championships next month. We encourage all students and families to come out and support our champions!'
                    }
                ]
            },
            schoolId: school.id,
            campusId: campus.id,
            categoryId: newsCategories[2].id,
            authorId: teachers[3].id, // PE Teacher
            status: newsStatusEnum.published,
            priority: newsPriorityEnum.high,
            visibility: newsVisibilityEnum.public,
            publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            isPinned: true,
            viewCount: 42,
            isArchived: false
        },
        {
            title: 'Library Renovation Project Update',
            excerpt: 'The much-anticipated library renovation is progressing well, with new study spaces, technology upgrades, and improved accessibility features set to be completed by the end of March.',
            content: {
                blocks: [
                    {
                        type: 'paragraph',
                        content: 'We are excited to provide an update on our library renovation project, which has been progressing smoothly since construction began in January.'
                    },
                    { type: 'heading', level: 3, content: "What's New:" },
                    {
                        type: 'list',
                        items: [
                            '20 new individual study pods with power outlets',
                            'Collaborative learning spaces for group projects',
                            'Updated computer lab with 30 new stations',
                            'Accessible ramps and wider doorways',
                            'Quiet reading nooks with comfortable seating'
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: 'We expect the renovation to be completed by late March, with a grand reopening celebration planned for early April.'
                    }
                ]
            },
            schoolId: school.id,
            campusId: campus.id,
            categoryId: newsCategories[0].id,
            authorId: admin.id,
            status: newsStatusEnum.published,
            priority: newsPriorityEnum.normal,
            visibility: newsVisibilityEnum.public,
            publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            isPinned: false,
            viewCount: 28,
            isArchived: false
        },
        {
            title: "Drama Club Presents: A Midsummer Night's Dream",
            excerpt: "Join us for our spring theatrical production featuring talented students from Years 8-12 in Shakespeare's beloved comedy, running March 15-17 in the school auditorium.",
            content: {
                blocks: [
                    {
                        type: 'paragraph',
                        content: `The ${school.name} Drama Club is thrilled to announce our spring production of William Shakespeare's "A Midsummer Night's Dream"!`
                    },
                    { type: 'heading', level: 3, content: 'Show Details:' },
                    {
                        type: 'list',
                        items: [
                            'Dates: March 15, 16, and 17',
                            'Time: 7:00 PM (doors open at 6:30 PM)',
                            'Location: School Auditorium',
                            'Tickets: $12 adults, $8 students/seniors',
                            'Duration: Approximately 2 hours with one intermission'
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: 'Come and support our talented students in what promises to be a magical theatrical experience!'
                    }
                ]
            },
            schoolId: school.id,
            campusId: campus.id,
            categoryId: newsCategories[2].id,
            authorId: teachers[1].id, // English Teacher
            status: newsStatusEnum.published,
            priority: newsPriorityEnum.normal,
            visibility: newsVisibilityEnum.public,
            publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            isPinned: false,
            viewCount: 35,
            isArchived: false
        },
        {
            title: 'Community Garden Project Launch',
            excerpt: 'Students, parents, and teachers are invited to participate in our new community garden project, promoting sustainability education and healthy eating habits.',
            content: {
                blocks: [
                    {
                        type: 'paragraph',
                        content: `We are excited to announce the launch of the ${school.name} Community Garden Project, a collaborative initiative that brings together students, families, and staff to create a sustainable learning environment.`
                    },
                    { type: 'heading', level: 3, content: 'How to Get Involved:' },
                    {
                        type: 'list',
                        items: [
                            'Volunteer for weekend planting sessions',
                            'Donate seeds, tools, or materials',
                            'Join the Garden Committee as a parent representative',
                            'Participate in harvest festivals and educational workshops'
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: 'Our first community planting day is scheduled for Saturday, March 10th from 9:00 AM to 2:00 PM.'
                    }
                ]
            },
            schoolId: school.id,
            campusId: campus.id,
            categoryId: newsCategories[3].id,
            authorId: teachers[2].id, // Science Teacher
            status: newsStatusEnum.published,
            priority: newsPriorityEnum.normal,
            visibility: newsVisibilityEnum.public,
            publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            isPinned: false,
            viewCount: 22,
            isArchived: false
        },
        {
            title: 'Parent-Teacher Conference Scheduling Now Open',
            excerpt: 'Online booking for Term 1 parent-teacher conferences is now available. Conferences will be held during Week 8, with both in-person and virtual options available.',
            content: {
                blocks: [
                    {
                        type: 'paragraph',
                        content: 'We are pleased to announce that online booking for Term 1 parent-teacher conferences is now open through our school portal.'
                    },
                    { type: 'heading', level: 3, content: 'Conference Details:' },
                    {
                        type: 'list',
                        items: [
                            'Dates: March 19-21 (Week 8)',
                            'Times: 3:30 PM - 7:00 PM each day',
                            'Duration: 15 minutes per appointment',
                            'Options: In-person or video conference',
                            'Booking deadline: March 15th'
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: "We encourage all parents to take advantage of this opportunity to connect with their child's teachers."
                    }
                ]
            },
            schoolId: school.id,
            campusId: campus.id,
            categoryId: newsCategories[0].id,
            authorId: admin.id,
            status: newsStatusEnum.published,
            priority: newsPriorityEnum.high,
            visibility: newsVisibilityEnum.public,
            publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
            isPinned: false,
            viewCount: 67,
            isArchived: false
        }
    ]);

    console.log('  Created 7 news articles');
}
