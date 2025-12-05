import { NOMIC_API_KEY } from '$env/static/private';
import { NomicEmbeddings } from './nomic';

export type EmbeddingProvider = 'nomic';

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  dimensions?: number;
}

export function createEmbeddings(config: EmbeddingConfig = { provider: 'nomic' }) {
  switch (config.provider) {
    case 'nomic':
      return new NomicEmbeddings({
        apiKey: NOMIC_API_KEY,
        model: 'nomic-embed-text-v1.5' 
      });
    
    default:
      throw new Error(`Unknown embedding provider: ${config.provider}`);
  }
}

// Default embeddings for your application
export const defaultEmbeddings = createEmbeddings({ provider: 'nomic' });