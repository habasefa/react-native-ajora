import { GoogleGenAI, Type } from "@google/genai";
import { nativeTools } from "./tools/toolsDeclaration";
import { agentPrompt, assistantPrompt } from "./system_prompt";
import { Message } from "../db/dbService";

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not set. Create example-backend/.env and set GEMINI_API_KEY."
  );
}

const genAI = new GoogleGenAI({
  apiKey,
});

export const gemini = async function* (
  message: Message[],
  mode: "agent" | "assistant" = "agent"
) {
  try {
    if (message.length === 0) {
      throw new Error("Message is empty");
    }
    const formattedMessage = message.map((message) => ({
      role: message.role,
      parts: message.parts,
    }));

    const systemInstruction = mode === "agent" ? agentPrompt : assistantPrompt;
    const response = await genAI.models.generateContentStream({
      model: "gemini-2.5-pro",
      contents: formattedMessage,
      config: {
        tools: [
          {
            functionDeclarations: nativeTools,
          },
        ],
        systemInstruction: systemInstruction,
      },
    });

    for await (const chunk of response) {
      yield chunk;
    }
  } catch (error) {
    console.error("Error in gemini:", error);
  }
};
const CHECK_PROMPT = `
Analyze *only* the content and structure of the turn history. Based *strictly* on that response, determine who should logically speak next: the 'user' or the 'model' (you).

Your decision must respect the following rules and updated behavioral expectations based on the agent's new mandates (sequential tasking, tool articulation/reflection, and stepwise execution).

---

### 🔎 Decision Rules (Apply in Order):

1. **Model Continues (Incomplete or Next Action Pending):**  
   - If your last response explicitly indicates an *intended next step* that the model itself should take (e.g., "Next, I will…", "Now I'll call the tool…", "Proceeding to analyze…"),  
   - OR if it mentions a tool action but the tool was **not yet called**,  
   - OR if the response ends mid-thought or clearly lacks a natural conclusion,  
   → Then the **'model'** should speak next.

2. **Tool Articulation or Reflection Required:**  
   - If your last response contains a plan to use a tool **but you have not yet articulated what you expect from that tool**, or you **have not reflected on the tool result after receiving it**,  
   → Then the **'model'** should speak next.

3. **Question to User:**  
   - If your last response ends with a **direct question specifically addressed to the user** (e.g., clarification, confirmation, or input request),  
   → Then the **'user'** should speak next.

4. **Sequential Task Progression (Multi-step Objective):**  
   - If the user's overall request involves a **sequence of subtasks** (e.g., answering questions 1–5 one by one) and **the next subtask is still pending**,  
   - AND your last response completed the current subtask but did not explicitly request user input,  
   → Then the **'model'** should speak next (to proceed to the next step in the sequence).

5. **Objective Check (Past 5 Turns):**  
   - If the overall objective (e.g., all subtasks completed, or final reflection delivered) is **not yet fully achieved**,  
   - AND none of the above conditions apply,  
   → Then the **'model'** should speak next.

6. **Waiting for User:**  
   - If your last response completed a thought or task, no further subtasks are pending, no tool reflection or articulation is missing, and there is no pending action,  
   - OR if it ends with a user-facing question,  
   → Then the **'user'** should speak next.

---

### ⚙️ Tool Context:
- **Server Tools:** When a server tool is mentioned but not yet executed, the **model** must continue.  
- **Client Tools:** When a client tool is invoked (e.g., confirm_action), the **user** must respond next.

---

### ✅ Additional Notes:
- Always consider the **sequential nature of tasks**. If the user's multi-part question is not fully addressed yet, the default is usually **model continues**.  
- The model should not stop between subtasks unless explicitly requiring user input.  
- Reflective steps (before/after tool use) are considered part of the model’s responsibility — if they’re missing, the next speaker is the **model**.



IF THE THERE IS A TOOL CALL, AND THE TOOL CALL IS SERVER TOOL, THEN THE NEXT SPEAKER **MUST BE** THE **MODEL**.

Even if the models seems to have completed its task, if its last resposne has intention of next action like I'll mark the last step as complete, then the next speaker **MUST BE** THE **MODEL**.

<example>
Last response: "... I'll mark the last step as complete."

The next speaker **MUST BE** THE **MODEL**.

</example>

`;

const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    reasoning: {
      type: "string",
      description:
        "Brief explanation justifying the 'next_speaker' choice based *strictly* on the applicable rule and the content/structure of the preceding turn.",
    },
    next_speaker: {
      type: "string",
      enum: ["user", "model"],
      description:
        "Who should speak next based *only* on the preceding turn and the decision rules",
    },
  },
  required: ["reasoning", "next_speaker"],
};

export interface NextSpeakerResponse {
  reasoning: string;
  next_speaker: "user" | "model";
}

const nextSpeaker = async (
  history: Message[]
): Promise<NextSpeakerResponse | null> => {
  // Only take the last 10 messages
  const last10Messages = history.slice(-10);
  console.log(
    "[Ajora:Server][nextSpeaker][0.A]: Last Messages",
    JSON.stringify(last10Messages[last10Messages.length - 1], null, 2)
  );
  const singleHistory = JSON.stringify(last10Messages, null, 2);

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Here is the history: ${singleHistory}\n\n${CHECK_PROMPT}. 
            Just to remind about the last message, here it is: ${JSON.stringify(last10Messages[last10Messages.length - 1], null, 2)}. 
            You must consider this message for your decision, especially if it has any tool call or function call or anything that is relevant to the decision.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });
  const nextSpeaker = JSON.parse(response.text ?? "") as NextSpeakerResponse;
  return nextSpeaker;
};

export { nextSpeaker };

export const threadTitleUpdate = async (history: Message[]) => {
  // Sanitize history: keep only text parts to avoid passing function calls/responses
  const sanitized = history
    .map((msg) => {
      const textParts = (msg.parts || [])
        .map((p: any) => (p && p.text ? { text: p.text } : null))
        .filter(Boolean) as { text: string }[];
      if (textParts.length === 0) return null;
      return {
        role: msg.role,
        parts: textParts,
      } as any;
    })
    .filter(Boolean) as any[];

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [
        ...sanitized,
        {
          role: "user",
          parts: [
            {
              text: "Given the conversation above, respond with a title for the thread in 3-4 words.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
          },
          required: ["title"],
        },
      },
    });

    const title = JSON.parse(response.text ?? "");

    return title.title;
  } catch (error) {
    console.error("Error in threadTitleUpdate:", error);
    return "Untitled Thread";
  }
};
