# Agent Brief

You should use Svelte 5 for all of your code, and reference existing examples in the repository where possible.

Prefer using native forms over creating API routes, and make sure to use superforms and Zod v4 for form schema validation.

Make sure to use shadcn-svelte components for all of your UI designs. If a component does not exist in shadcn-svelte, please ask for next steps.

Where possible, use TypeScript Pick or Omit types rather than redefining types that already exist in the schema to ensure a single-source-of-truth for types.

Never put database calls in +page.server.ts files. Instead, preference using or adding to the database services.

When including @lucide/svelte icons, you do not need to apply h-4 w-4 as that is the default size.

You do not need to add the LoaderData and Action types to Svelte pages, as Svelte does this out of the box from v5.

Database related rules:

- When referencing other tables use onDelete 'cascade' by default.
- When defining an enum, ensure that you prefix it with enum\_ for the name.
- If the camelCase name is the same as what the column name will be in snake case, don't input a custom column name into the drizzle column function. See other tables for examples.
- If you add a foreign key or uniqueness rule, ensure that you add an index and/or uniqueIndex respectively.

#fetch https://shadcn-svelte.com/docs/components

#fetch https://svelte.dev/llms-full.txt

# Temporary (feel free to delete after mid Feb)

Adjust all of my schema files so that:

- There are indexes on foreign keys. Use example below.
- Junction tables use the two foreign keys as the primary key, rather than another id
- Junction tables have the ...essentialsNoId spread on them
- Any column that has a lowerCamelCase name the same as the snake case name has the snake case name argument removed

e.g. countryCode: varchar('country_code', { length: 2 }), would become countryCode: varchar({ length: 2 }),

// One-to-many with cascade
export const posts = pgTable('posts', {
id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
title: text('title').notNull(),
authorId: integer('author_id')
.references(() => users.id, {
onDelete: 'cascade',
onUpdate: 'cascade'
})
.notNull(),
}, (table) => [
// Always index foreign keys
index('posts_author_idx').on(table.authorId),
]);

// Many-to-many junction table
export const postsToTags = pgTable('posts_to_tags', {
postId: integer('post_id')
.references(() => posts.id, { onDelete: 'cascade' })
.notNull(),
tagId: integer('tag_id')
.references(() => tags.id, { onDelete: 'cascade' })
.notNull(),
}, (table) => [
primaryKey({ columns: [table.postId, table.tagId] }),
index('posts_tags_post_idx').on(table.postId),
index('posts_tags_tag_idx').on(table.tagId),
]);
