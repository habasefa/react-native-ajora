import dayjs from "dayjs";

const date = dayjs().subtract(1, "year");

export default () => [
  {
    _id: Math.round(Math.random() * 1000000),
    role: "user",
    parts: [
      {
        text: "I'm new to React Native development. Can you help me understand the basics?",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        text: "Absolutely! I'd be happy to help you get started with React Native. Let me search for some comprehensive beginner resources for you.",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        functionCall: {
          id: "search_basics_1",
          name: "websearch",
          args: {
            query: "React Native beginner tutorial 2024 getting started",
            max_results: 5,
          },
        },
      },
    ],
    createdAt: date,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        functionResponse: {
          id: "search_basics_1",
          name: "websearch",
          response: {
            results: [
              {
                title: "React Native Getting Started Guide",
                url: "https://reactnative.dev/docs/getting-started",
                snippet:
                  "Official React Native documentation with step-by-step setup instructions",
              },
              {
                title: "React Native Tutorial for Beginners",
                url: "https://reactnative.dev/docs/tutorial",
                snippet:
                  "Complete tutorial covering components, navigation, and state management",
              },
              {
                title: "Building Your First React Native App",
                url: "https://reactnative.dev/docs/first-app",
                snippet:
                  "Hands-on guide to creating your first mobile application",
              },
            ],
          },
        },
      },
    ],
    createdAt: date,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        text: "Great! I found some excellent resources. React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components. Would you like me to help you set up your development environment?",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "user",
    parts: [
      {
        text: "Yes, that would be helpful! What do I need to install first?",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        functionCall: {
          id: "search_setup_1",
          name: "websearch",
          args: {
            query:
              "React Native development environment setup 2024 Node.js Android Studio Xcode",
            max_results: 4,
          },
        },
      },
    ],
    createdAt: date,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        functionResponse: {
          id: "search_setup_1",
          name: "websearch",
          response: {
            results: [
              {
                title: "React Native Environment Setup",
                url: "https://reactnative.dev/docs/environment-setup",
                snippet:
                  "Complete guide to setting up React Native development environment for iOS and Android",
              },
              {
                title: "Installing React Native CLI",
                url: "https://reactnative.dev/docs/environment-setup#installing-dependencies",
                snippet:
                  "Step-by-step instructions for installing React Native CLI and dependencies",
              },
              {
                title: "Android Studio Setup for React Native",
                url: "https://reactnative.dev/docs/environment-setup#android-development-environment",
                snippet:
                  "Configuring Android Studio and Android SDK for React Native development",
              },
            ],
          },
        },
      },
    ],
    createdAt: date,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        text: "Perfect! Here's what you'll need to install: Node.js, React Native CLI, Android Studio (for Android development), and Xcode (for iOS development on Mac). Let me create a simple checklist for you.",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        functionCall: {
          id: "create_checklist_1",
          name: "create_file",
          args: {
            filename: "setup-checklist.md",
            content:
              "# React Native Setup Checklist\n\n## Prerequisites\n- [ ] Node.js (v18 or later)\n- [ ] npm or yarn\n- [ ] React Native CLI\n\n## Android Development\n- [ ] Java Development Kit (JDK)\n- [ ] Android Studio\n- [ ] Android SDK\n- [ ] Android Virtual Device (AVD)\n\n## iOS Development (Mac only)\n- [ ] Xcode\n- [ ] iOS Simulator\n- [ ] CocoaPods\n\n## Verification\n- [ ] Run `npx react-native doctor` to check setup",
          },
        },
      },
    ],
    createdAt: date,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        functionResponse: {
          id: "create_checklist_1",
          name: "create_file",
          response: {
            success: true,
            message: "Setup checklist created successfully",
          },
        },
      },
    ],
    createdAt: date,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        text: "I've created a setup checklist for you! Once you have everything installed, you can create your first React Native project with `npx react-native init MyFirstApp`. Would you like me to show you how to create a simple component?",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "user",
    parts: [
      {
        text: "That sounds great! Can you show me a simple example?",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        functionCall: {
          id: "create_example_1",
          name: "create_file",
          args: {
            filename: "SimpleComponent.js",
            content:
              "import React from 'react';\nimport { View, Text, StyleSheet } from 'react-native';\n\nconst SimpleComponent = () => {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>Hello, React Native!</Text>\n      <Text style={styles.subtitle}>This is your first component</Text>\n    </View>\n  );\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    justifyContent: 'center',\n    alignItems: 'center',\n    backgroundColor: '#f0f0f0',\n  },\n  title: {\n    fontSize: 24,\n    fontWeight: 'bold',\n    color: '#333',\n    marginBottom: 10,\n  },\n  subtitle: {\n    fontSize: 16,\n    color: '#666',\n  },\n});\n\nexport default SimpleComponent;",
          },
        },
      },
    ],
    createdAt: date,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        functionResponse: {
          id: "create_example_1",
          name: "create_file",
          response: {
            success: true,
            message: "Example component created successfully",
          },
        },
      },
    ],
    createdAt: date,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        text: "Perfect! I've created a simple React Native component for you. This component demonstrates the basics: importing React Native components, creating a functional component, and using StyleSheet for styling. You can use this as a starting point for your own components!",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "user",
    parts: [
      {
        audio: {
          uri: "file:///path/to/audio/voice-message.mp3",
          name: "voice-message.mp3",
          size: 245760, // 240 KB
          mimeType: "audio/mpeg",
        },
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        text: "I received your voice message! I can hear that you're asking about React Native performance optimization. Let me help you with that.",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "user",
    parts: [
      {
        file: {
          uri: "file:///path/to/document/react-native-guide.pdf",
          name: "react-native-guide.pdf",
          size: 1048576, // 1 MB
          mimeType: "application/pdf",
        },
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        text: "Thanks for sharing the React Native guide PDF! I can see it's a comprehensive 1MB document. Would you like me to help you with any specific sections from this guide?",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "user",
    parts: [
      {
        file: {
          uri: "file:///path/to/spreadsheet/project-budget.xlsx",
          name: "project-budget.xlsx",
          size: 512000, // 500 KB
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        text: "I see you've shared a project budget spreadsheet. This looks like an Excel file with your React Native project costs. Is there anything specific you'd like me to help you analyze or calculate from this budget?",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
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
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "model",
    parts: [
      {
        text: "I've listened to your feedback audio message. Thank you for the detailed input about the React Native tutorial! I'll incorporate your suggestions into future examples.",
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "user",
    parts: [
      {
        file: {
          uri: "file:///path/to/code/App.js",
          name: "App.js",
          size: 8192, // 8 KB
          mimeType: "application/javascript",
        },
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "user",
    parts: [
      {
        file: {
          uri: "file:///path/to/archive/project-files.zip",
          name: "project-files.zip",
          size: 2097152, // 2 MB
          mimeType: "application/zip",
        },
      },
    ],
    createdAt: date,
    sent: true,
  },
  {
    _id: Math.round(Math.random() * 1000000),
    role: "user",
    parts: [
      {
        file: {
          uri: "file:///path/to/presentation/demo.pptx",
          name: "demo.pptx",
          size: 3145728, // 3 MB
          mimeType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        },
      },
    ],
    createdAt: date,
    sent: true,
  },
];
