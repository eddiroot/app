# eddi

The all-in-one teaching, learning, and admin software suite for schools.

## Our Mission

- Save teachers time and give them the tools they need to teach effectively.
- Make school admin effortless and dramatically simplify everyday tasks.
- Give schools back control of their data and reduce the number of systems they need to run.

# Contributing

We currently don't expect contributions from members outside of the core team. Though, if you feel passionate about eddi's cause and want to help out, we welcome issues and/or pull requests! Please kindly note; we cannot provide any guarantees at this stage on whether we will read/action/consider these.

# Developing

## Setup

1. Paste the following commands

```bash
docker compose up -d
npm install
npm run db:migrate
npm run db:push
npm run db:seed
npm run dev
```

## Cleaning schema

1. Paste the following commands

```bash
docker compose down --volumes
docker compose up --detach
npm run db:migrate
npm run db:push
npm run db:seed
npm run dev
```

## Common Git Tricks

If you need to clear all local branches except main:

```bash
git branch | grep -v "main" | xargs git branch -D
```

## UI

To add new [shadcn-svelte components](https://www.shadcn-svelte.com/docs/components), use this command:

```bash
npx shadcn-svelte@latest add component-name-here
```
