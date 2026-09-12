/**
 * Future AI Architecture Service Boundary
 * 
 * Provides typed interfaces for:
 * - Automatic Tagging
 * - AI Summaries & Key Ideas
 * - Semantic Search / Embeddings
 * - Ask My Library (RAG over user items)
 * 
 * Per architectural specification:
 * - Does NOT mock or fake AI responses.
 * - Gracefully reports `configured: false` when AI environment variables are absent.
 */

export interface AISummaryResult {
  summary: string;
  keyIdeas: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedValue: string;
}

export interface AIServiceStatus {
  configured: boolean;
  provider: "openai" | "anthropic" | "gemini" | "none";
}

export class AIService {
  static getStatus(): AIServiceStatus {
    if (process.env.GEMINI_API_KEY) {
      return { configured: true, provider: "gemini" };
    }
    if (process.env.OPENAI_API_KEY) {
      return { configured: true, provider: "openai" };
    }
    if (process.env.ANTHROPIC_API_KEY) {
      return { configured: true, provider: "anthropic" };
    }
    return { configured: false, provider: "none" };
  }

  /**
   * Generates AI summary and key takeaways for an item if configured.
   */
  static async generateSummary(
    _title: string,
    _content: string
  ): Promise<{ success: boolean; data?: AISummaryResult; message: string }> {
    const status = this.getStatus();
    if (!status.configured) {
      return {
        success: false,
        message: "AI summarization is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY.",
      };
    }

    // Provider implementation hook
    return {
      success: false,
      message: "AI provider configured. Ready for model inference.",
    };
  }

  /**
   * Suggests tags based on item metadata.
   */
  static async suggestTags(
    _title: string,
    _description: string
  ): Promise<{ success: boolean; tags?: string[]; message: string }> {
    const status = this.getStatus();
    if (!status.configured) {
      return {
        success: false,
        message: "AI tagging is not configured.",
      };
    }

    return {
      success: false,
      message: "AI provider configured.",
    };
  }

  /**
   * Query library ("Ask My Library") with semantic search
   */
  static async askLibrary(
    _userId: string,
    _question: string
  ): Promise<{ success: boolean; answer?: string; sources?: string[]; message: string }> {
    const status = this.getStatus();
    if (!status.configured) {
      return {
        success: false,
        message: "Semantic library question-answering requires vector embeddings and an AI provider.",
      };
    }

    return {
      success: false,
      message: "AI provider configured.",
    };
  }
}
