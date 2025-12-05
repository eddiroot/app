// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

// Make sure to run sudo npx sst tunnel install to setup the SST Tunnel locally

export default $config({
	app(input) {
		const isProd = ['production'].includes(input?.stage);
		return {
			name: 'eddi',
			removal: isProd ? 'retain' : 'remove',
			protect: isProd,
			home: 'aws',
			providers: {
				aws: {
					profile: isProd ? 'eddi-prod' : 'eddi-dev'
				}
			}
		};
	},
	async run() {
		const vpc = new sst.aws.Vpc('VPC', { bastion: true });

		// pgvector is built in
		// https://aws.amazon.com/about-aws/whats-new/2023/05/amazon-rds-postgresql-pgvector-ml-model-integration/
		const database = new sst.aws.Postgres('Database', {
			instance: 't4g.micro',
			version: '18.1',
			vpc,
			dev: {
				username: 'postgres',
				password: 'password',
				database: 'eddi',
				host: 'localhost',
				port: 5432
			},
			proxy: true
		});

		new sst.x.DevCommand('Studio', {
			link: [database],
			dev: {
				command: 'npx drizzle-kit studio'
			}
		});

		const bucket = new sst.aws.Bucket('BucketSchools');

		const geminiApiKey = new sst.Secret('GeminiApiKey');
		const geminiDefaultModel = new sst.Secret('GeminiDefaultModel');

		const googleClientId = new sst.Secret('GoogleClientId');
		const googleClientSecret = new sst.Secret('GoogleClientSecret');
		const microsoftClientId = new sst.Secret('MicrosoftClientId');
		const microsoftClientSecret = new sst.Secret('MicrosoftClientSecret');
		const microsoftTenantId = new sst.Secret('MicrosoftTenantId');

		const cluster = new sst.aws.Cluster('Cluster', {
			vpc
		});

		const fet = new sst.aws.Task('FET', {
			cluster,
			link: [database, bucket],
			image: {
				context: './infra/fet',
				dockerfile: 'Dockerfile'
			}
		});

		// const email = new sst.aws.Email('Email', {
		// 	sender: 'no-reply@eddi.com.au'
		// });

		const app = new sst.aws.SvelteKit('EddiApp', {
			vpc,
			link: [
				bucket,
				fet,
				database,
				geminiApiKey,
				geminiDefaultModel,
				googleClientId,
				googleClientSecret,
				microsoftClientId,
				microsoftClientSecret,
				microsoftTenantId
			], // + email
			domain: {
				name: 'eddi.com.au',
				redirects: ['www.eddi.com.au', 'eddi.au', 'www.eddi.au'],
				aliases: ['*.eddi.com.au']
			}
		});

		return {
			resources: { vpc, database, bucket, cluster, fet, app }
		};
	}
});
