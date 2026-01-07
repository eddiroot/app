# Agent Brief

When asked to code anything in this project, please keep the following concepts and considerations in mind to ensure you produce the best output.

## Requirements

### Core Technologies & Frameworks

- **SvelteKit**: Full-stack framework with SSR/SSG capabilities
- **Svelte 5**: Latest version with modern runes syntax (`$state`, `$props`, `$derived`)
- **TypeScript**: Strongly typed throughout - always use proper typing
- **Drizzle ORM**: Database interactions with PostgreSQL
- **Docker**: Containerized PostgreSQL database
- **ShadCN Svelte**: UI component library - [Link](https://www.shadcn-svelte.com/docs)
  - Always prefer ShadCN components over custom UI
  - Import patterns: `import * as Card from '$lib/components/ui/card'`
- **Tailwind CSS**: Utility-first styling with custom design system
- **Lucide Svelte**: Icon library (`@lucide/svelte`)

### Project-Specific Technologies

- **TipTap**: Rich text editor with custom extensions
- **JSDOM**: Server-side HTML parsing (Node.js compatible)
- **FET Timetabling**: Integration with FET (Free Educational Timetabling) software
- **Prisma**: Secondary ORM for specific use cases
- **AI Integration**: Google Gemini API for educational AI assistant

## Architecture & Structure

### File Organization

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/               # ShadCN components
│   │   ├── edra/             # Rich text editor components
│   │   └── *.svelte          # Custom components
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema/       # Drizzle schema definitions
│   │   │   └── seed/         # Database seeding
│   │   └── *.ts              # Server utilities
│   ├── stores/               # Svelte stores
│   ├── types/                # TypeScript type definitions
│   ├── enums.ts              # Shared enumerations
│   └── utils.ts              # Utility functions
├── routes/                   # SvelteKit file-based routing
└── scripts/                  # Build and utility scripts
```

### Database Schema Patterns

- **PostgreSQL**: Primary database with Drizzle ORM
- **Schema Structure**: Modular schema files in `src/lib/server/db/schema/`
- **Enums**: PostgreSQL enums for type safety
- **Relationships**: Proper foreign key relationships
- **Timestamps**: Consistent created/updated timestamps

### Route Structure Patterns

- **File-based routing**: SvelteKit conventions
- **Server actions**: `+page.server.ts` for data loading
- **Form actions**: Server-side form handling
- **API routes**: `+server.ts` files for API endpoints
- **Dynamic routes**: `[param]` syntax for dynamic segments

## Considerations

### Educational Domain Expertise

- **VCAA Curriculum**: Victorian Curriculum and Assessment Authority
- **Year Levels**: Foundation to Year 12 (F, 1-12)
- **Subject Structure**: Learning areas, subjects, content descriptions
- **Timetabling**: Complex scheduling with constraints
- **Assessment**: Rubrics, tasks, submissions
- **User Types**: Students, teachers, guardians, admins

### Performance & Scalability

- **Server-side rendering**: Use SvelteKit SSR capabilities
- **Database optimization**: Efficient queries with Drizzle
- **File uploads**: Object storage integration
- **Caching**: Strategic caching for performance

### Security & Privacy

- **Authentication**: Secure user sessions
- **Authorization**: Role-based access control
- **Data protection**: Student privacy compliance
- **CSRF protection**: Enabled by default
- **Input validation**: Server-side validation always

### Code Quality Standards

- **TypeScript strict mode**: No `any` types
- **ESLint + Prettier**: Consistent code formatting
- **Error handling**: Comprehensive error boundaries
- **Testing**: Unit and integration tests
- **Documentation**: Clear comments and JSDoc

## Recommended Workflow

### 1. Understanding the Task

- **Domain Context**: Understand the educational context and user needs
- **Data Flow**: Trace data from database → server → client
- **User Experience**: Consider all user types (student, teacher, admin)
- **Mobile Responsiveness**: Ensure mobile-friendly designs

### 2. Database First Approach

```typescript
// 1. Define/update schema if needed
export const newTable = pgTable('new_table', {
	id: uuid('id').defaultRandom().primaryKey(),
	// ... other fields
	...timestamps
});

// 2. Update types
export type NewTableType = typeof newTable.$inferSelect;
export type NewTableInsert = typeof newTable.$inferInsert;

// 3. Run migration
// npm run db:push
```

### 3. Server-Side Implementation

```typescript
// +page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const data = await db.select().from(table);
	return { data };
};
```

### 4. Client-Side Implementation

```svelte
<!-- +page.svelte -->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Use Svelte 5 runes syntax
	let selectedItem = $state(null);
	let computedValue = $derived(selectedItem?.property);
</script>
```

### 5. Component Patterns

```svelte
<!-- Use proper TypeScript -->
<script lang="ts">
	interface Props {
		data: DataType;
		optional?: string;
	}

	let { data, optional = 'default' }: Props = $props();
</script>

<!-- Use ShadCN components -->
<Card.Root>
	<Card.Header>
		<Card.Title>Title</Card.Title>
	</Card.Header>
	<Card.Content>
		<!-- Content -->
	</Card.Content>
</Card.Root>
```

### 6. Error Handling

```typescript
// Server-side
try {
	const result = await db.operation();
	return { success: true, data: result };
} catch (error) {
	console.error('Operation failed:', error);
	return { success: false, error: 'User-friendly message' };
}
```

### 7. Testing Approach

- **Manual testing**: Always test in browser during development
- **Data validation**: Verify database operations
- **User flows**: Test complete user journeys
- **Cross-browser**: Ensure compatibility

### 8. Common Commands

```bash
# Development
npm run dev

# Database operations
npm run db:push          # Push schema changes
npm run db:seed          # Seed with test data
npm run db:studio        # Visual database interface

# Code quality
npm run format           # Format with Prettier
npm run lint             # ESLint checks
npm run check            # TypeScript checking
```

### 9. Key Design Principles

- **Educational Focus**: Always consider the learning experience
- **Accessibility**: WCAG compliance for all users
- **Progressive Enhancement**: Works without JavaScript
- **Mobile First**: Responsive design patterns
- **Performance**: Fast loading and interactions

### 10. Integration Points

- **FET Timetabling**: HTML parsing with JSDOM
- **VCAA Curriculum**: Structured educational content
- **AI Assistant**: Context-aware educational support
- **File Storage**: Object storage for media
- **Real-time Features**: WebSocket integration

### 11. Additional Instructions

You should use Svelte 5 for all of your code, and reference existing examples in the repository where possible. Prefer using native forms over creating API routes, and make sure to use superforms and zod 4 for form schema validation.

Make sure to use shadcn-svelte components for all of your UI designs. If a component does not exist in shadcn-svelte, please ask for next steps.

Where possible, use TypeScript Pick or Omit types rather than redefining types that already exist in the schema to ensure a single-source-of-truth for types.

Never put database calls in +page.server.ts files. Instead, preference using or adding to the database services.

When including @lucide/svelte icons, you do not need to apply h-4 w-4 as that is the default size.

You do not need to add the LoaderData and Action types to Svelte pages, as Svelte does this out of the box from v5.

When referencing other tables use onDelete 'cascade' by default

#fetch https://shadcn-svelte.com/docs/components

#fetch https://svelte.dev/llms-full.txt
