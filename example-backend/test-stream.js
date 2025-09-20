// Test script to verify the streaming endpoint
import fetch from "node-fetch";

const API_BASE_URL = "http://localhost:3000";

async function testStream() {
  try {
    console.log("Testing streaming endpoint...");

    const response = await fetch(`${API_BASE_URL}/api/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "Hello, how are you?" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("Stream completed");
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log("Received chunk:", chunk);
    }
  } catch (error) {
    console.error("Error testing stream:", error);
  }
}

testStream();
