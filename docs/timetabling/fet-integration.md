# FET Timetabling Integration Setup Guide

This document explains how to set up and use the FET (Free Timetabling Software) integration with your Eddi application.

## Overview

The integration uses Docker to run FET in a containerized Ubuntu environment, allowing your web application to generate timetables without needing to install FET directly on the host system.

## Architecture

```
Frontend (SvelteKit) → API Endpoint → Queue System → Docker FET Service → Results Processing
```

1. **Frontend Component**: `TimetableGenerator.svelte` provides the user interface
2. **API Endpoint**: `/api/timetables/generate` handles requests and queuing
3. **Queue System**: Existing database-based queue for processing timetables
4. **Docker Service**: Isolated FET execution environment
5. **Processing Script**: Updated to use Docker instead of local FET installation

## Setup Instructions

### 1. Start the Services

```bash
# Start all services including the new FET container
npm run db:start:detached

# Or start with logs visible
npm run db:start
```

### 2. Verify FET Container

Check that the FET container is running:

```bash
# Check container status
docker ps | grep fet

# Check FET installation in container
docker exec eddi-fet-1 fet-cl --version
```

### 3. Using the Timetable Generator

#### In your Svelte page/component:

```svelte
<script>
	import TimetableGenerator from '$lib/components/TimetableGenerator.svelte';

	// Your timetable data
	export let data;
	const { timetable, fetXmlContent } = data;
</script>

<TimetableGenerator
	timetableId={timetable.id}
	{fetXmlContent}
	fileName={`timetable_${timetable.id}.fet`}
/>
```

#### API Usage (if calling directly):

```javascript
// Generate timetable
const response = await fetch('/api/timetables/generate', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		timetableId: 123,
		fetXmlContent: '<fet>...</fet>',
		fileName: 'school_timetable.fet'
	})
});

// Check service status
const status = await fetch('/api/timetables/generate');
```

## How It Works

### 1. Queue-Based Processing

When a user clicks "Generate Timetable":

1. Request is validated and added to the database queue
2. Response is returned immediately (non-blocking)
3. Background processor picks up queued items
4. FET execution happens in Docker container
5. Results are processed and stored in database

### 2. Docker Integration

The `FETDockerService` class handles:

- Writing input files to the container
- Executing FET commands via `docker exec`
- Reading output files from the container
- Cleaning up temporary files

### 3. Error Handling

- Container availability checks
- Timeout handling (20 minutes max)
- Cleanup on success and failure
- Queue status updates (queued → in-progress → completed/failed)

## File Structure

```
eddi/
├── fet/
│   └── Dockerfile              # FET container definition
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── TimetableGenerator.svelte  # UI component
│   │   └── server/
│   │       └── services/
│   │           └── fet-docker.ts          # Docker service
│   ├── routes/
│   │   └── api/
│   │       └── timetables/
│   │           └── generate/
│   │               └── +server.ts         # API endpoint
│   └── scripts/
│       └── processTimetable.ts            # Updated processor
├── docker-compose.yml          # Updated with FET service
└── package.json               # Updated with Docker commands
```

## Troubleshooting

### FET Service Not Running

```bash
# Check container status
docker ps -a | grep fet

# Start if stopped
docker compose up -d fet

# Check logs
docker compose logs fet
```

### Permission Issues

```bash
# Ensure Docker daemon is running
sudo systemctl start docker

# Add user to docker group (requires logout/login)
sudo usermod -aG docker $USER
```

### Long Processing Times

- FET can take 5-20 minutes for complex timetables
- Monitor progress in container logs:
  ```bash
  docker compose logs -f fet
  ```

### Memory Issues

- Large timetables may need more memory
- Update docker-compose.yml if needed:
  ```yaml
  fet:
    # ... existing config
    deploy:
      resources:
        limits:
          memory: 2G
  ```

## Development

### Testing the Integration

1. Use the existing timetable generation UI
2. Check queue status in database
3. Monitor Docker container logs
4. Verify output file processing

### Customizing FET Parameters

Edit the FET command in `fet-docker.ts`:

```typescript
const fetCommand = `fet-cl --inputfile="input.fet" --outputdir="/output" --htmllevel=7 --timelimitminutes=20`;
```

### Adding New Features

- Extend the `FETDockerService` class
- Update the API endpoint for new parameters
- Modify the Svelte component for new UI elements

## Security Considerations

- Docker containers provide isolation
- File operations are contained within Docker volumes
- No direct file system access from web requests
- Queue-based processing prevents request flooding

## Performance Tips

- Use `docker compose up -d` to run services in background
- Monitor Docker container resource usage
- Clean up old queue entries periodically
- Consider running processing on a separate server for production
