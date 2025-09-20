import dayjs from "dayjs";

const date1 = dayjs();
const date2 = date1.clone().subtract(1, "day");
const date3 = date2.clone().subtract(1, "week");

export default [
  {
    _id: 1,
    role: "user",
    parts: [
      {
        text: "Hi! I'm working on a React Native project and need some help with the latest features.",
      },
    ],
    createdAt: date3,
    sent: true,
  },
  {
    _id: 2,
    role: "model",
    parts: [
      {
        text: "Hello! I'd be happy to help you with React Native. Let me search for the latest information about React Native features and updates.",
      },
    ],
    createdAt: date3,
    sent: true,
  },
  {
    _id: 3,
    role: "model",
    parts: [
      {
        functionCall: {
          id: "search_1",
          name: "websearch",
          args: {
            query: "React Native latest features 2024 new architecture",
            max_results: 5,
          },
        },
      },
    ],
    createdAt: date3,
  },
  {
    _id: 4,
    role: "model",
    parts: [
      {
        functionResponse: {
          id: "search_1",
          name: "websearch",
          response: {
            results: [
              {
                title: "React Native 0.74 Release Notes",
                url: "https://reactnative.dev/blog/2024/06/04/0.74-stable-release",
                snippet:
                  "New architecture improvements, enhanced developer experience, and new APIs including improved debugging tools",
              },
              {
                title: "React Native New Architecture Guide",
                url: "https://reactnative.dev/docs/the-new-architecture/landing-page",
                snippet:
                  "Complete guide to the new architecture with Fabric renderer and TurboModules",
              },
              {
                title: "React Native Performance Improvements 2024",
                url: "https://reactnative.dev/blog/2024/03/15/performance-improvements",
                snippet:
                  "Significant performance enhancements in startup time and memory usage",
              },
            ],
          },
        },
      },
    ],
    createdAt: date3,
  },
  {
    _id: 5,
    role: "model",
    parts: [
      {
        text: "Great! I found some excellent resources. The latest React Native 0.74 includes major improvements to the new architecture, better performance, and enhanced developer tools. Would you like me to look at your current project structure to give you more specific advice?",
      },
    ],
    createdAt: date3,
    sent: true,
  },
  {
    _id: 6,
    role: "user",
    parts: [
      {
        text: "Yes, that would be helpful! Can you check what files I have in my project?",
      },
    ],
    createdAt: date2,
    sent: true,
  },
  {
    _id: 7,
    role: "model",
    parts: [
      {
        functionCall: {
          id: "list_1",
          name: "list_files",
          args: {
            directory: "./src",
            recursive: true,
          },
        },
      },
    ],
    createdAt: date2,
  },
  {
    _id: 8,
    role: "model",
    parts: [
      {
        functionResponse: {
          id: "list_1",
          name: "list_files",
          response: {
            files: [
              "src/index.ts",
              "src/types.ts",
              "src/Bubble/index.tsx",
              "src/MessageText.tsx",
              "src/MessageToolCall.tsx",
              "src/Ajora/index.tsx",
              "src/MessageContainer/index.tsx",
              "src/Composer.tsx",
              "src/Send.tsx",
            ],
          },
        },
      },
    ],
    createdAt: date2,
  },
  {
    _id: 9,
    role: "model",
    parts: [
      {
        text: "I can see you have a well-structured React Native chat UI project! You have components for messages, bubbles, tool calls, and a composer. Let me check one of your key files to understand your current implementation better.",
      },
    ],
    createdAt: date2,
    sent: true,
  },
  {
    _id: 10,
    role: "model",
    parts: [
      {
        functionCall: {
          id: "read_1",
          name: "read_file",
          args: {
            filename: "src/types.ts",
          },
        },
      },
    ],
    createdAt: date2,
  },
  {
    _id: 11,
    role: "model",
    parts: [
      {
        functionResponse: {
          id: "read_1",
          name: "read_file",
          response: {
            content:
              "export interface IMessage {\n  _id: string | number;\n  role: 'user' | 'model';\n  parts: Part[];\n  feedback?: 'like' | 'dislike';\n  createdAt: Date | number;\n  sent?: boolean;\n  pending?: boolean;\n}\n\nexport interface Part {\n  thought?: boolean;\n  functionCall?: FunctionCall;\n  functionResponse?: FunctionResponse;\n  text?: string;\n  audio?: string;\n  image?: string;\n}",
          },
        },
      },
    ],
    createdAt: date2,
  },
  {
    _id: 12,
    role: "model",
    parts: [
      {
        text: "Perfect! I can see you're using a modern message structure with support for tool calls and different content types. Your IMessage interface is well-designed with the new parts-based approach. This is exactly what you need for building AI-powered chat applications!",
      },
    ],
    createdAt: date2,
    sent: true,
  },
  {
    _id: 13,
    role: "user",
    parts: [
      {
        text: "That's great! I'm also interested in adding some advanced features. Can you search for information about React Native animations and gesture handling?",
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 14,
    role: "model",
    parts: [
      {
        functionCall: {
          id: "search_2",
          name: "websearch",
          args: {
            query:
              "React Native animations gesture handling 2024 best practices",
            max_results: 4,
          },
        },
      },
    ],
    createdAt: date1,
  },
  {
    _id: 15,
    role: "model",
    parts: [
      {
        functionResponse: {
          id: "search_2",
          name: "websearch",
          response: {
            results: [
              {
                title: "React Native Reanimated 3 Guide",
                url: "https://docs.swmansion.com/react-native-reanimated/",
                snippet:
                  "Complete guide to React Native Reanimated 3 with new APIs and improved performance",
              },
              {
                title: "React Native Gesture Handler Tutorial",
                url: "https://docs.swmansion.com/react-native-gesture-handler/",
                snippet:
                  "Advanced gesture handling with native performance and smooth animations",
              },
              {
                title: "Building Smooth Animations in React Native",
                url: "https://reactnative.dev/docs/animations",
                snippet:
                  "Official React Native animation documentation with examples and best practices",
              },
            ],
          },
        },
      },
    ],
    createdAt: date1,
  },
  {
    _id: 16,
    role: "model",
    parts: [
      {
        text: "Excellent choice! For advanced animations and gestures, I recommend React Native Reanimated 3 and Gesture Handler. These libraries provide native-level performance and are perfect for building smooth, interactive chat interfaces like yours. Would you like me to help you implement any specific animations?",
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 17,
    role: "user",
    parts: [
      {
        text: "Actually, let me share some files with you to test the new message components!",
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 18,
    role: "user",
    parts: [
      {
        file: {
          uri: "file:///path/to/document/project-requirements.pdf",
          name: "project-requirements.pdf",
          size: 1048576, // 1 MB
          mimeType: "application/pdf",
        },
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 19,
    role: "model",
    parts: [
      {
        text: "I can see you've shared a project requirements PDF (1 MB). The new file message component looks great with the whitish background and file icon!",
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 20,
    role: "user",
    parts: [
      {
        audio: {
          uri: "file:///path/to/audio/voice-note.mp3",
          name: "voice-note.mp3",
          size: 512000, // 500 KB
          mimeType: "audio/mpeg",
        },
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 21,
    role: "model",
    parts: [
      {
        text: "I received your voice note (500 KB)! The new audio message component with the whitish background and clean design is working perfectly.",
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 22,
    role: "user",
    parts: [
      {
        file: {
          uri: "file:///path/to/code/App.tsx",
          name: "App.tsx",
          size: 8192, // 8 KB
          mimeType: "text/typescript",
        },
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 23,
    role: "user",
    parts: [
      {
        file: {
          uri: "file:///path/to/spreadsheet/budget.xlsx",
          name: "budget.xlsx",
          size: 256000, // 250 KB
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 24,
    role: "model",
    parts: [
      {
        text: "Perfect! I can see both your TypeScript code file (8 KB) with the 💻 icon and your Excel budget spreadsheet (250 KB) with the 📊 icon. The new message components are displaying beautifully with proper file type recognition and size formatting!",
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 25,
    role: "user",
    parts: [
      {
        audio: {
          uri: "file:///path/to/audio/feedback.mp3",
          name: "feedback.mp3",
          size: 1024000, // 1 MB
          mimeType: "audio/mpeg",
        },
      },
    ],
    createdAt: date1,
    sent: true,
  },
  {
    _id: 26,
    role: "model",
    parts: [
      {
        text: "Thank you for the feedback audio (1 MB)! The new message types are working great. The whitish background theme gives a clean, modern look to both audio and file messages.",
      },
    ],
    createdAt: date1,
    sent: true,
  },
];
