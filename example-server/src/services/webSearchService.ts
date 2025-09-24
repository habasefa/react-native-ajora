import dotenv from "dotenv";
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

  async searchWeb(query: string) {
    console.info("Searching web:", query);
    try {
      const response = await fetch(
        `${this.apiUrl}?q=${encodeURIComponent(query)}&count=3`,
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
      return formattedData as WebSearchResult[];
    } catch (error) {
      console.error("Error searching web:", error);
      throw error;
    }
  }
}

export { WebSearchService };

// const webSearchService = new WebSearchService();

// // Note: Do not execute searches at import time; the agent/tools will call this service.
// webSearchService
//   .searchWeb("What is the staple food of Ethiopia?")
//   .then((result) => {
//     console.log(result);
//   });
