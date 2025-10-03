import "react-native";
import React from "react";
import renderer from "react-test-renderer";
import { MessageToolCall } from "../Tool";
import { IMessage } from "../types";

// Mock the native tools
jest.mock("../nativeTools", () => ({
  TodoListTool: ({ request }: any) => {
    return React.createElement("View", { testID: "todo-list-tool" }, [
      React.createElement("Text", { key: "tool-name" }, request.tool.name),
    ]);
  },
  WebSearchTool: ({ request }: any) => {
    return React.createElement("View", { testID: "web-search-tool" }, [
      React.createElement("Text", { key: "tool-name" }, request.tool.name),
    ]);
  },
  DocSearchTool: ({ request }: any) => {
    return React.createElement("View", { testID: "doc-search-tool" }, [
      React.createElement("Text", { key: "tool-name" }, request.tool.name),
    ]);
  },
  nativeTools: ["todo_list", "search_web", "search_document"],
}));

// Mock the AjoraContext
jest.mock("../AjoraContext", () => ({
  useChatContext: () => ({
    ajora: {
      submitQuery: jest.fn(),
    },
  }),
}));

describe("MessageToolCall", () => {
  const createTestMessage = (toolName: string, args: any = {}): IMessage => ({
    _id: "test-message-1",
    thread_id: "test-thread-1",
    role: "model",
    parts: [
      {
        functionCall: {
          id: "call-123",
          name: toolName,
          args,
        },
      },
    ],
    createdAt: new Date().toISOString(),
  });

  it("should render TodoListTool for todo_list function call", () => {
    const message = createTestMessage("todo_list", { action: "get" });
    
    const tree = renderer.create(
      <MessageToolCall currentMessage={message} position="left" />
    );

    expect(tree).toMatchSnapshot();
    
    // Check that the TodoListTool component is rendered
    const todoTool = tree.root.findByProps({ testID: "todo-list-tool" });
    expect(todoTool).toBeTruthy();
  });

  it("should render WebSearchTool for search_web function call", () => {
    const message = createTestMessage("search_web", { query: "test query" });
    
    const tree = renderer.create(
      <MessageToolCall currentMessage={message} position="left" />
    );

    expect(tree).toMatchSnapshot();
    
    // Check that the WebSearchTool component is rendered
    const webTool = tree.root.findByProps({ testID: "web-search-tool" });
    expect(webTool).toBeTruthy();
  });

  it("should render DocSearchTool for search_document function call", () => {
    const message = createTestMessage("search_document", { query: "test query" });
    
    const tree = renderer.create(
      <MessageToolCall currentMessage={message} position="left" />
    );

    expect(tree).toMatchSnapshot();
    
    // Check that the DocSearchTool component is rendered
    const docTool = tree.root.findByProps({ testID: "doc-search-tool" });
    expect(docTool).toBeTruthy();
  });

  it("should return null for unknown tool", () => {
    const message = createTestMessage("unknown_tool", {});
    
    const tree = renderer.create(
      <MessageToolCall currentMessage={message} position="left" />
    );

    expect(tree.toJSON()).toBeNull();
  });

  it("should return null when no tool call parts", () => {
    const message: IMessage = {
      _id: "test-message-1",
      thread_id: "test-thread-1",
      role: "model",
      parts: [{ text: "Hello world" }],
      createdAt: new Date().toISOString(),
    };
    
    const tree = renderer.create(
      <MessageToolCall currentMessage={message} position="left" />
    );

    expect(tree.toJSON()).toBeNull();
  });

  it("should handle multiple tool calls", () => {
    const message: IMessage = {
      _id: "test-message-1",
      thread_id: "test-thread-1",
      role: "model",
      parts: [
        {
          functionCall: {
            id: "call-1",
            name: "todo_list",
            args: { action: "get" },
          },
        },
        {
          functionCall: {
            id: "call-2",
            name: "search_web",
            args: { query: "test" },
          },
        },
      ],
      createdAt: new Date().toISOString(),
    };
    
    const tree = renderer.create(
      <MessageToolCall currentMessage={message} position="left" />
    );

    expect(tree).toMatchSnapshot();
    
    // Check that both tools are rendered
    const todoTool = tree.root.findByProps({ testID: "todo-list-tool" });
    const webTool = tree.root.findByProps({ testID: "web-search-tool" });
    
    expect(todoTool).toBeTruthy();
    expect(webTool).toBeTruthy();
  });
});

