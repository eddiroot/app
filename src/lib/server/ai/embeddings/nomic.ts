import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";

export interface NomicEmbeddingsParams extends EmbeddingsParams {
  apiKey?: string;
  model?: string;
  taskType?: 'search_document' | 'search_query' | 'clustering' | 'classification';
}

export class NomicEmbeddings extends Embeddings {
  private apiKey: string;
  private model: string = "nomic-embed-text-v1.5";
  private baseUrl: string = "https://api-atlas.nomic.ai/v1";
  
  // Nomic embeddings are 768 dimensions
  readonly dimensions: number = 768;

  constructor(params?: NomicEmbeddingsParams) {
    super(params ?? {});
    this.apiKey = params?.apiKey || process.env.NOMIC_API_KEY!;
    if (!this.apiKey) {
      throw new Error('NOMIC_API_KEY is required');
    }
    this.model = params?.model || this.model;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/embedding/text`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        texts: documents,
        task_type: "search_document"
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Nomic API error: ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    return data.embeddings;
  }

  async embedQuery(query: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embedding/text`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        texts: [query],
        task_type: "search_query"
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Nomic API error: ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    return data.embeddings[0];
  }
}