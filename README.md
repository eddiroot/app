# eddi

The all-in-one teaching, learning, and admin software suite for schools.

## Our Mission

- Save teachers time and give them the tools they need to teach effectively.
- Make school admin effortless and dramatically simplify everyday tasks.
- Give schools back control of their data and reduce the number of systems they need to run.

# Features

This section is still a work-in-progress. Watch this space!

# Pricing

While eddi isn't out yet, we do have some ideas on pricing and will welcome any suggestions.

1. eddi has only one pricing tier. There will only ever be one pricing tier.
2. Every customer of eddi's gets the same advanced functionality, forever.
3. The pricing is at a set rate so that the school can accurately estimate costs.
4. It is billed _per student_, **not** per user. This means accounts belonging to teachers, staff, and guardians are free.

# Contributing

We don't expect contributions from members outside of the core team. Though, if you feel passionate about eddi's cause and want to help out, we welcome issues and/or pull requests!

Please note we cannot provide any guarantees at this stage on whether we will read, action, or consider these.

# Developing

## Setup

```bash
docker compose -f docker-compose.dev.yml up -d
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Reset

```bash
docker compose -f docker-compose.dev.yml down --volumes
docker compose -f docker-compose.dev.yml up --detach
npm run db:push
npm run db:seed
npm run dev
```

## Git Tricks

If you need to clear all local branches except main:

```bash
git branch | grep -v "main" | xargs git branch -D
```

## UI

To add new [shadcn-svelte components](https://www.shadcn-svelte.com/docs/components), use this command:

```bash
npx shadcn-svelte@latest add component-name-here
```
