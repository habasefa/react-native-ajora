# 🤖 React Native Ajora

<div align="center">

**The most complete AI agent UI for React Native**

[![npm version](https://badge.fury.io/js/react-native-ajora.svg)](https://badge.fury.io/js/react-native-ajora)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)](https://reactnative.dev/)

_Build beautiful, intelligent chat interfaces with AI agents in React Native_

</div>

---

## ✨ Features

- 🎨 **Beautiful UI Components** - Pre-built, customizable chat components
- 🧠 **AI Agent Ready** - Built specifically for AI agent interactions
- 📱 **Cross-Platform** - Works on iOS, Android, and Web
- 🎯 **TypeScript Support** - Full TypeScript definitions included
- 🔧 **Highly Customizable** - Extensive theming and customization options
- 💬 **Rich Media Support** - Images, audio, files, and more
- 🧵 **Thread Management** - Multi-conversation support
- ⌨️ **Smart Keyboard** - Intelligent keyboard handling
- 🎭 **Animations** - Smooth, native animations
- 🔌 **Tool Integration** - Easy integration with AI tools and functions
- 📊 **Thinking Indicators** - Visual feedback for AI processing
- 🎨 **Markdown Support** - Rich text rendering with LaTeX support

## 🚀 Quick Start

### Installation

```bash
npm install react-native-ajora
# or
yarn add react-native-ajora
```

### Peer Dependencies

Make sure you have these peer dependencies installed:

```bash
npm install @expo/vector-icons @gorhom/bottom-sheet react-native-keyboard-controller react-native-reanimated
```

### Basic Usage

```tsx
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ajora } from "react-native-ajora";

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Ajora
        isScrollToBottomEnabled
        keyboardShouldPersistTaps="never"
        infiniteScroll
        onSend={(messages) => {
          console.log("New messages:", messages);
        }}
      />
    </SafeAreaView>
  );
};

export default App;
```

## 📖 Documentation

### Core Components

#### Ajora

The main chat component that orchestrates all other components.

```tsx
<Ajora
  messages={messages}
  onSend={handleSend}
  isThinking={isThinking}
  showHeader={true}
  showThreads={true}
  renderTools={() => [TimeTool, WeatherTool]}
/>
```

#### Message Types

```tsx
interface IMessage {
  _id: string | number;
  role: "user" | "model";
  parts: Part[];
  feedback?: "like" | "dislike";
  createdAt: Date | number;
  pending?: boolean;
}

interface Part {
  thought?: boolean;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
  text?: string;
  audio?: AudioData;
  image?: string;
  file?: FileData;
}
```

### Advanced Features

#### Thread Management

```tsx
<Ajora
  showThreads={true}
  onThreadSelect={(thread) => {
    console.log("Selected thread:", thread);
  }}
  onNewThread={() => {
    console.log("Creating new thread");
  }}
/>
```

#### Custom Tools

```tsx
const TimeTool = {
  name: "get_current_time",
  description: "Get the current time",
  parameters: {
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: "Timezone to get time for",
      },
    },
  },
};

<Ajora renderTools={() => [TimeTool]} />;
```

#### Custom Styling

```tsx
<Ajora
  messagesContainerStyle={{
    backgroundColor: "#f0f0f0",
  }}
  renderBubble={(props) => <CustomBubble {...props} />}
  renderInputToolbar={(props) => <CustomInputToolbar {...props} />}
/>
```

## 🎨 Screenshots

<div align="center">

![Chat Interface](media/photo_2025-09-20_09-43-38.jpg)
_Beautiful chat interface with AI agent_

![Thread Management](media/photo_2025-09-20_09-43-42.jpg)
_Multi-thread conversation management_

![Advanced Features](media/photo_2025-09-20_09-43-49.jpg)
_Advanced AI agent features and tools_

![Custom Styling](media/photo_2025-09-20_09-43-54.jpg)
_Customizable interface and theming_

</div>

## 🔧 Configuration

### Keyboard Handling

```tsx
<Ajora
  keyboardShouldPersistTaps="never"
  focusOnInputWhenOpeningKeyboard={true}
  isKeyboardInternallyHandled={true}
  bottomOffset={0}
/>
```

### Message Container

```tsx
<Ajora
  infiniteScroll={true}
  isScrollToBottomEnabled={true}
  loadEarlier={true}
  onLoadEarlier={loadEarlierMessages}
/>
```

### Input Customization

```tsx
<Ajora
  maxInputLength={1000}
  minComposerHeight={40}
  maxComposerHeight={100}
  textInputProps={{
    placeholder: "Type your message...",
    multiline: true,
  }}
/>
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18
- React Native development environment
- Expo CLI (for example app)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/habasefa/react-native-ajora.git
cd react-native-ajora
```

2. Install dependencies:

```bash
npm install
```

3. Start the example app:

```bash
npm start
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:coverage
```

## 📚 Examples

Check out the `example/` directory for comprehensive examples:

- **Basic Chat** - Simple chat implementation
- **Tool Integration** - AI tools and function calls
- **Custom Styling** - Themed chat interface
- **Thread Management** - Multi-conversation support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for the React Native community
- Inspired by modern chat interfaces and AI agent UIs
- Special thanks to Farid and [react-native-giftedchat](https://github.com/FaridSafi/react-native-gifted-chat) contributors

## 📞 Support

- 📧 Email: [nazrihabtish@gmail.com](mailto:nazrihabtish@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/habasefa/react-native-ajora/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/habasefa/react-native-ajora/discussions)

---

<div align="center">

**Made with ❤️ by [Habtamu Asefa](https://github.com/habasefa)**

[⭐ Star us on GitHub](https://github.com/habasefa/react-native-ajora) • [📖 Documentation](https://github.com/habasefa/react-native-ajora#readme) • [🐛 Report Bug](https://github.com/habasefa/react-native-ajora/issues) • [✨ Request Feature](https://github.com/habasefa/react-native-ajora/issues)

</div>
