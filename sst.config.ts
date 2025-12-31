// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

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
		const isDev = $app.stage === 'dev';
		const isProd = $app.stage === 'production';
		if (!isDev && !isProd) {
			throw new Error(`Invalid stage: ${$app.stage}. Must be 'dev' or 'production'.`);
		}

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
			proxy: false
		});

		new sst.x.DevCommand('Studio', {
			link: [database],
			dev: {
				command: 'npx drizzle-kit studio'
			}
		});

		const bucket = new sst.aws.Bucket('BucketSchools');

		const cluster = new sst.aws.Cluster('Cluster', {
			vpc
		});

		// const fet = new sst.aws.Task('FET', {
		// 	cluster,
		// 	link: [database, bucket],
		// 	image: {
		// 		context: './infra/fet',
		// 		dockerfile: 'Dockerfile'
		// 	}
		// });

		// const email = new sst.aws.Email('Email', {
		// 	sender: 'no-reply@eddi.com.au'
		// });

		const googleClientId = new sst.Secret('GoogleClientID', 'use-sst-secret-store');
		const googleClientSecret = new sst.Secret('GoogleClientSecret', 'use-sst-secret-store');
		const microsoftTenantId = new sst.Secret('MicrosoftTenantID', 'use-sst-secret-store');
		const microsoftClientId = new sst.Secret('MicrosoftClientID', 'use-sst-secret-store');
		const microsoftClientSecret = new sst.Secret('MicrosoftClientSecret', 'use-sst-secret-store');
		const geminiApiKey = new sst.Secret('GeminiAPIKey', 'use-sst-secret-store');
		const nomicApiKey = new sst.Secret('NomicAPIKey', 'use-sst-secret-store');
		const webhookNotificationsOnboarding = new sst.Secret(
			'WebhookNotificationsOnboarding',
			'use-sst-secret-store'
		);

		const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';
		const GEMINI_DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image-generation';

		const app = new sst.aws.Service('EddiApp', {
			cluster,
			capacity: 'spot',
			// Fargate Spot allows you to run containers on spare AWS capacity at around 50% discount compared to regular Fargate.
			// At release, we can evaluate moving to regular Fargate as AWS can technically shutdown Spot instances with little notice.
			link: [
				bucket,
				database,
				googleClientId,
				googleClientSecret,
				microsoftTenantId,
				microsoftClientId,
				microsoftClientSecret,
				geminiApiKey,
				nomicApiKey,
				webhookNotificationsOnboarding
			], // + fet + email
			environment: {
				GEMINI_DEFAULT_MODEL,
				GEMINI_DEFAULT_IMAGE_MODEL
			},
			image: {
				context: '.',
				dockerfile: 'infra/Dockerfile'
			},
			loadBalancer: {
				domain: {
					name: 'eddi.com.au',
					aliases: ['*.eddi.com.au']
				},
				rules: [
					{ listen: '80/http', redirect: '443/https' },
					{ listen: '443/https', forward: '3000/http' }
				]
			},
			// Set to defaults; adjust at rollout
			scaling: {
				min: 1,
				max: 1
			},
			dev: {
				command: 'npm run dev'
			}
		});

		const router = isProd
			? new sst.aws.Router('DomainRedirects', {
					routes: {
						'/*': app.url
					},
					domain: {
						name: 'www.eddi.com.au',
						aliases: ['eddi.au', 'www.eddi.au']
					}
				})
			: null;

		return {
			resources: { vpc, database, bucket, cluster, app, router } // + fet + email
		};
	}
});
