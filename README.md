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

1. Paste the profiles into your `~/.aws/config`

2. Run the following commands one-by-one

```bash
docker compose up -d
npm install
npm run sso
npx sst dev
```

3. In a new terminal, run these commands

```bash
npx sst secret set SecretName secret-value
# repeat for each secret in sst.config.ts
npm run db:migrate
npm run db:push
npm run db:restore -- snapshots/eddi_vcaa.sql.gz
npm run db:seed
```

## Cleaning schema

2. Run the following commands

```bash
docker compose down --volumes
docker compose up -d
npx sst dev
```

3. In a new terminal, run these commands

```bash
npm run db:migrate
npm run db:restore -- snapshots/eddi_vcaa.sql.gz
npm run db:push
npm run db:seed
```

## git stuff

If you need to clear all local branches except main:

```bash
git branch | grep -v "main" | xargs git branch -D
```

## UI

To add new [shadcn-svelte components](https://www.shadcn-svelte.com/docs/components), use this command:

```bash
npx shadcn-svelte@latest add component-name-here
```

# Deploying

## Everything

```bash
npx sst deploy --stage production
```

## DB Updates

```bash
# run the below command in its own terminal
npx sst tunnel --stage production
# in a new terminal, run:
npx sst shell --stage production -- npx drizzle-kit push
```
