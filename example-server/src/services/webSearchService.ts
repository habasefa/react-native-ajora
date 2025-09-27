import dotenv from "dotenv";
import { ToolResult } from "../toolExecutor";
dotenv.config();

interface WebSearchProfile {
  name: string;
  url: string;
  long_name: string;
  img: string;
}

interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  profile: WebSearchProfile;
}

class WebSearchService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.BRAVE_API_KEY || "";
    if (!this.apiKey) {
      throw new Error(
        "BRAVE_API_KEY is not set. Create .env and set BRAVE_API_KEY."
      );
    }
    this.apiUrl = "https://api.search.brave.com/res/v1/web/search";
  }

  async searchWeb(query: string): Promise<ToolResult> {
    console.info("Searching web:", query);
    try {
      const response = await fetch(
        `${this.apiUrl}?q=${encodeURIComponent(query)}&count=5`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": this.apiKey,
          },
        }
      );
      if (!response.ok) {
        const body = await response.text();

        throw new Error(`${response.status} ${response.statusText}: ${body}`);
      }
      const data = await response.json();
      const formattedData = data.web.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        profile: {
          name: result.profile.name,
          url: result.profile.url,
          long_name: result.profile.long_name,
          img: result.profile.img,
        },
      }));
      return { output: formattedData, error: null };
    } catch (error) {
      console.error("Error searching web:", error);
      return { output: null, error: error };
    }
  }
}

export { WebSearchService };
