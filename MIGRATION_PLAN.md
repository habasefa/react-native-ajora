# Migration Plan: React Native Ajora → AG-UI + CopilotKit v2.x

## Executive Summary

This document outlines a detailed, step-by-step migration plan for rewriting the React Native Ajora chat library to use the AG-UI protocol and CopilotKit v2.x packages. The migration will modernize the codebase, improve maintainability, and align with industry-standard agent communication patterns.

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Target Architecture](#target-architecture)
3. [Migration Strategy](#migration-strategy)
4. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
5. [API Compatibility Layer](#api-compatibility-layer)
6. [Testing Strategy](#testing-strategy)
7. [Rollout Plan](#rollout-plan)
8. [Risk Mitigation](#risk-mitigation)

---

## Current Architecture Analysis

### Current State Components

#### 1. **State Management** (`src/hooks/useAjora.tsx`, `src/hooks/ajoraReducer.tsx`)

- **Pattern**: Custom React `useReducer` with action-based state updates
- **State Structure**:
  ```typescript
  {
    stream: IMessage[],
    messages: Record<string, IMessage[]>, // threadId -> messages
    threads: Thread[],
    activeThreadId: string | null,
    isThinking: boolean,
    loadEarlier: boolean,
    isLoadingMessages: boolean,
    mode: string,
    baseUrl: string,
    apiService: ApiService | null,
    isComplete: boolean,
    attachement: Attachement | undefined,
    isRecording: boolean
  }
  ```
- **Actions**: 20+ action types (ADD_MESSAGES, UPDATE_STREAMING_MESSAGE, etc.)

#### 2. **API Communication** (`src/api.ts`)

- **Protocol**: Server-Sent Events (SSE) via `react-native-sse`
- **Endpoints**:
  - `/api/stream` - Streaming responses
  - `/api/threads/{threadId}/messages` - Message retrieval
- **Event Types**: message, function_response, thread_title, sources, suggestions, is_thinking, complete, error

#### 3. **Message Format** (`src/types.ts`)

- **Structure**:
  ```typescript
  interface IMessage {
    _id: string;
    thread_id: string;
    role: "user" | "model";
    parts: Part[]; // Google GenAI format
    createdAt?: string;
    updatedAt?: string;
  }
  ```
- **Parts**: Can contain text, functionCall, functionResponse

#### 4. **UI Components**

- React Native components using `react-native-reanimated`
- Custom message rendering (text, images, files, tool calls)
- Keyboard handling via `react-native-keyboard-controller`

#### 5. **Provider Pattern** (`src/AjoraProvider.tsx`)

- Simple context provider wrapping `useAjora` hook

---

## Target Architecture

### CopilotKit v2.x Architecture

#### 1. **State Management via AbstractAgent**

- **Pattern**: Agent-based state with reactive subscriptions
- **State Location**: Messages stored on `AbstractAgent.messages` array
- **Reactivity**: Event-driven via `agent.subscribe()` callbacks

#### 2. **AG-UI Protocol**

- **Standard**: Industry-standard agent communication protocol
- **Transport**: HTTP/REST or WebSocket (SSE support via runtime)
- **Message Format**: AG-UI `Message` type (role, content, id)

#### 3. **CopilotKitCore**

- **Purpose**: Cross-framework orchestration layer
- **Responsibilities**:
  - Agent registry and lifecycle
  - Tool execution coordination
  - State synchronization
  - Runtime connection management

#### 4. **React Integration** (`@copilotkitnext/react`)

- **Provider**: `CopilotKitProvider` - manages core instance
- **Hooks**: `useAgent`, `useCopilotKit`, `useRenderToolCall`
- **Components**: `CopilotChat`, `CopilotChatView` (web-focused, need RN adaptation)

---

## Migration Strategy

### High-Level Approach

1. **Incremental Migration**: Build compatibility layer, migrate component by component
2. **Backward Compatibility**: Maintain existing API surface during transition
3. **React Native Adaptation**: Create RN-specific wrappers for web components
4. **Protocol Bridge**: Map AG-UI events to/from current SSE format

### Key Decisions

1. **Create React Native Package**: New `@copilotkitnext/react-native` package
2. **Agent Adapter**: Bridge between AbstractAgent and current state management
3. **Message Format Converter**: Transform between IMessage and AG-UI Message
4. **SSE Transport**: Implement AG-UI over SSE for React Native compatibility

---

## Phase-by-Phase Implementation

### Phase 0: Preparation & Setup (Week 1)

#### 0.1 Create New Package Structure

```
react-native-ajora/
├── packages/
│   ├── react-native/          # New RN-specific package
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   └── adapters/
│   │   └── package.json
│   ├── core/                   # Fork/adapt CopilotKit core
│   └── shared/                  # Shared utilities
└── src/                        # Legacy code (deprecated gradually)
```

#### 0.2 Install Dependencies

```json
{
  "dependencies": {
    "@copilotkitnext/core": "^2.x",
    "@ag-ui/client": "^latest",
    "react-native-sse": "^x.x.x" // Keep for transport
  }
}
```

#### 0.3 Setup Type Definitions

- Create type mapping between `IMessage` and AG-UI `Message`
- Define adapter interfaces
- Document migration types

**Deliverables:**

- ✅ Package structure created
- ✅ Dependencies installed
- ✅ Type definitions established
- ✅ Development environment configured

---

### Phase 1: Core Infrastructure (Weeks 2-3)

#### 1.1 Create AG-UI Transport Adapter

**File**: `packages/react-native/src/adapters/sse-transport.ts`

**Purpose**: Bridge AG-UI protocol over SSE for React Native

**Implementation**:

```typescript
import { AbstractAgent, Message } from "@ag-ui/client";
import EventSource from "react-native-sse";

export class SSETransportAdapter {
  private eventSource: EventSource | null = null;
  private agent: AbstractAgent;

  connect(runtimeUrl: string, agent: AbstractAgent): void {
    // Map AG-UI events to SSE stream
    // Handle connection lifecycle
  }

  private handleSSEEvent(event: any): void {
    // Convert SSE events to AG-UI events
    // Update agent.messages
  }
}
```

**Tasks**:

- [ ] Implement SSE connection management
- [ ] Map SSE events to AG-UI protocol events
- [ ] Handle reconnection logic
- [ ] Error handling and recovery

#### 1.2 Create Message Format Converter

**File**: `packages/react-native/src/adapters/message-converter.ts`

**Purpose**: Convert between Ajora `IMessage` and AG-UI `Message`

**Implementation**:

```typescript
import { Message } from "@ag-ui/client";
import { IMessage } from "../../src/types";

export function convertToAGUIMessage(imessage: IMessage): Message {
  // Convert IMessage.parts to Message.content
  // Handle function calls as tool calls
  // Preserve metadata
}

export function convertFromAGUIMessage(
  message: Message,
  threadId: string
): IMessage {
  // Convert Message.content to IMessage.parts
  // Extract tool calls from content
  // Maintain backward compatibility
}
```

**Tasks**:

- [ ] Implement bidirectional conversion
- [ ] Handle function calls/tool calls
- [ ] Preserve message metadata
- [ ] Handle edge cases (attachments, etc.)

#### 1.3 Create Agent Adapter

**File**: `packages/react-native/src/adapters/agent-adapter.ts`

**Purpose**: Bridge AbstractAgent to current state management pattern

**Implementation**:

```typescript
import { AbstractAgent } from "@ag-ui/client";
import { AjoraState } from "../../src/hooks/useAjora";

export class AgentStateAdapter {
  private agent: AbstractAgent;
  private stateCallback: (state: Partial<AjoraState>) => void;

  constructor(
    agent: AbstractAgent,
    onStateChange: (state: Partial<AjoraState>) => void
  ) {
    this.agent = agent;
    this.stateCallback = onStateChange;

    // Subscribe to agent changes
    agent.subscribe({
      onMessagesChanged: () => this.syncMessages(),
      onStateChanged: () => this.syncState(),
      onRunInitialized: () => this.syncRunning(true),
      onRunFinalized: () => this.syncRunning(false),
    });
  }

  private syncMessages(): void {
    // Convert agent.messages to Ajora message format
    // Update state via callback
  }
}
```

**Tasks**:

- [ ] Implement state synchronization
- [ ] Map agent events to reducer actions
- [ ] Handle thread switching
- [ ] Maintain backward compatibility

**Deliverables:**

- ✅ SSE transport adapter working
- ✅ Message converter tested
- ✅ Agent adapter functional
- ✅ Unit tests for all adapters

---

### Phase 2: Provider Migration (Week 4)

#### 2.1 Create CopilotKitProvider for React Native

**File**: `packages/react-native/src/providers/CopilotKitProvider.tsx`

**Purpose**: React Native-specific provider wrapping CopilotKitCore

**Implementation**:

```typescript
import React from "react";
import { CopilotKitCoreReact } from "@copilotkitnext/core";
import { SSETransportAdapter } from "../adapters/sse-transport";

export interface CopilotKitProviderProps {
  children: React.ReactNode;
  runtimeUrl: string;
  headers?: Record<string, string>;
  // ... other props
}

export const CopilotKitProvider: React.FC<CopilotKitProviderProps> = ({
  children,
  runtimeUrl,
  headers = {},
  ...props
}) => {
  const copilotkit = useMemo(() => {
    return new CopilotKitCoreReact({
      runtimeUrl,
      headers,
      // Configure for React Native
    });
  }, [runtimeUrl, headers]);

  // Setup SSE transport
  useEffect(() => {
    const transport = new SSETransportAdapter();
    // Connect transport to copilotkit
  }, [copilotkit]);

  return (
    <CopilotKitContext.Provider value={{ copilotkit }}>
      {children}
    </CopilotKitContext.Provider>
  );
};
```

**Tasks**:

- [ ] Create RN-specific provider
- [ ] Integrate SSE transport
- [ ] Handle initialization
- [ ] Error boundaries

#### 2.2 Create useAgent Hook for React Native

**File**: `packages/react-native/src/hooks/use-agent.tsx`

**Purpose**: React Native version of useAgent with state adapter

**Implementation**:

```typescript
import { useAgent as useWebAgent } from "@copilotkitnext/react";
import { AgentStateAdapter } from "../adapters/agent-adapter";
import { useReducer } from "react";

export function useAgent({ agentId, threadId }: UseAgentProps) {
  const { agent } = useWebAgent({ agentId });
  const [state, dispatch] = useReducer(ajoraReducer, initialState);

  useEffect(() => {
    const adapter = new AgentStateAdapter(agent, (updates) => {
      // Convert updates to reducer actions
      dispatch(updates);
    });

    return () => adapter.cleanup();
  }, [agent]);

  return { agent, ...state };
}
```

**Tasks**:

- [ ] Wrap web useAgent
- [ ] Integrate state adapter
- [ ] Maintain existing API
- [ ] Handle thread switching

**Deliverables:**

- ✅ CopilotKitProvider working in RN
- ✅ useAgent hook functional
- ✅ State synchronization working
- ✅ Integration tests passing

---

### Phase 3: Component Migration (Weeks 5-7)

#### 3.1 Create React Native Chat Component

**File**: `packages/react-native/src/components/CopilotChat.tsx`

**Purpose**: React Native version of CopilotChat

**Strategy**: Adapt web component to React Native, maintain existing Ajora API

**Implementation**:

```typescript
import { useAgent } from "../hooks/use-agent";
import { MessageContainer } from "../MessageContainer"; // Reuse existing
import { InputToolbar } from "../InputToolbar"; // Reuse existing

export function CopilotChat(props: CopilotChatProps) {
  const { agent } = useAgent({
    agentId: props.agentId,
    threadId: props.threadId
  });

  // Convert agent.messages to IMessage format for existing components
  const messages = useMemo(() => {
    return agent.messages.map(msg => convertFromAGUIMessage(msg, agent.threadId));
  }, [agent.messages, agent.threadId]);

  const onSubmit = useCallback((text: string) => {
    agent.addMessage({
      id: randomUUID(),
      role: "user",
      content: text,
    });
    copilotkit.runAgent({ agent });
  }, [agent, copilotkit]);

  return (
    <View>
      <MessageContainer messages={messages} />
      <InputToolbar onSubmit={onSubmit} />
    </View>
  );
}
```

**Tasks**:

- [ ] Create RN chat component
- [ ] Reuse existing UI components (MessageContainer, etc.)
- [ ] Integrate with agent
- [ ] Handle message rendering
- [ ] Keyboard handling

#### 3.2 Migrate Message Rendering

**Files**:

- `packages/react-native/src/components/Message.tsx`
- `packages/react-native/src/components/MessageText.tsx`
- `packages/react-native/src/components/MessageImage.tsx`

**Strategy**: Adapt existing components to work with AG-UI messages

**Tasks**:

- [ ] Update Message component to handle AG-UI format
- [ ] Create tool call renderer using `useRenderToolCall`
- [ ] Maintain existing styling
- [ ] Handle attachments

#### 3.3 Migrate Tool Call Rendering

**File**: `packages/react-native/src/components/ToolCallRenderer.tsx`

**Purpose**: Render tool calls using CopilotKit's render system

**Implementation**:

```typescript
import { useRenderToolCall } from "@copilotkitnext/react";
import { ToolCall } from "@ag-ui/client";

export function ToolCallRenderer({ toolCall, toolMessage }: Props) {
  const renderToolCall = useRenderToolCall();

  return renderToolCall({
    toolCall,
    toolMessage,
  });
}
```

**Tasks**:

- [ ] Create tool call renderer
- [ ] Integrate with existing Tool component
- [ ] Handle tool execution states
- [ ] Support custom renderers

**Deliverables:**

- ✅ Chat component working
- ✅ Message rendering functional
- ✅ Tool calls rendering
- ✅ UI matches existing design

---

### Phase 4: Feature Parity (Weeks 8-9)

#### 4.1 Thread Management

**File**: `packages/react-native/src/hooks/use-threads.tsx`

**Purpose**: Manage threads using agent.threadId

**Implementation**:

```typescript
export function useThreads() {
  const { copilotkit } = useCopilotKit();
  const [threads, setThreads] = useState<Thread[]>([]);

  const switchThread = useCallback(
    (threadId: string) => {
      const agent = copilotkit.getAgent(DEFAULT_AGENT_ID);
      agent.threadId = threadId;
      // Load messages for thread
    },
    [copilotkit]
  );

  return { threads, switchThread, createThread };
}
```

**Tasks**:

- [ ] Implement thread switching
- [ ] Thread creation
- [ ] Thread list management
- [ ] Persistence (if needed)

#### 4.2 Streaming & Real-time Updates

**Purpose**: Ensure streaming works with AG-UI protocol

**Tasks**:

- [ ] Verify SSE streaming works
- [ ] Handle incremental message updates
- [ ] Thinking indicators
- [ ] Completion states

#### 4.3 Attachments & Media

**Purpose**: Maintain attachment functionality

**Tasks**:

- [ ] File upload integration
- [ ] Image rendering
- [ ] Progress tracking
- [ ] Error handling

#### 4.4 Suggestions

**File**: `packages/react-native/src/hooks/use-suggestions.tsx`

**Purpose**: Integrate CopilotKit suggestions

**Implementation**:

```typescript
import { useSuggestions as useWebSuggestions } from "@copilotkitnext/react";

export function useSuggestions({ agentId }: Props) {
  const { suggestions, isLoading } = useWebSuggestions({ agentId });

  // Convert to Ajora suggestion format if needed
  return { suggestions, isLoading };
}
```

**Tasks**:

- [ ] Integrate suggestions hook
- [ ] Render suggestions UI
- [ ] Handle suggestion selection

**Deliverables:**

- ✅ All features working
- ✅ Feature parity achieved
- ✅ Performance acceptable
- ✅ No regressions

---

### Phase 5: API Compatibility Layer (Week 10)

#### 5.1 Maintain Backward Compatibility

**Purpose**: Allow gradual migration, support both APIs

**Strategy**: Create adapter that exposes old API while using new implementation

**File**: `packages/react-native/src/compat/AjoraCompat.tsx`

**Implementation**:

```typescript
export function AjoraCompat(props: AjoraProps) {
  // Use new CopilotKit internally
  const { agent } = useAgent({ agentId: "default" });
  const copilotkit = useCopilotKit();

  // Expose old API
  const ajora = useMemo(() => {
    return {
      messagesByThread: convertMessages(agent.messages),
      submitQuery: (query: UserEvent) => {
        // Convert to agent.addMessage + runAgent
      },
      // ... other methods
    };
  }, [agent, copilotkit]);

  return <Ajora {...props} ajora={ajora} />;
}
```

**Tasks**:

- [ ] Create compatibility wrapper
- [ ] Map all old API methods
- [ ] Maintain state shape
- [ ] Document migration path

#### 5.2 Deprecation Warnings

**Purpose**: Guide users to new API

**Tasks**:

- [ ] Add deprecation warnings
- [ ] Create migration guide
- [ ] Update documentation
- [ ] Provide examples

**Deliverables:**

- ✅ Compatibility layer working
- ✅ Deprecation warnings in place
- ✅ Migration guide complete
- ✅ Examples updated

---

### Phase 6: Testing & Polish (Weeks 11-12)

#### 6.1 Unit Tests

**Tasks**:

- [ ] Test all adapters
- [ ] Test message conversion
- [ ] Test state synchronization
- [ ] Test component rendering

#### 6.2 Integration Tests

**Tasks**:

- [ ] End-to-end chat flow
- [ ] Tool execution
- [ ] Thread switching
- [ ] Error scenarios

#### 6.3 Performance Testing

**Tasks**:

- [ ] Message rendering performance
- [ ] State update performance
- [ ] Memory usage
- [ ] Bundle size

#### 6.4 Documentation

**Tasks**:

- [ ] API documentation
- [ ] Migration guide
- [ ] Examples
- [ ] Troubleshooting guide

**Deliverables:**

- ✅ Test coverage >80%
- ✅ All tests passing
- ✅ Performance benchmarks met
- ✅ Documentation complete

---

## API Compatibility Layer

### Mapping Old API to New API

#### State Management

| Old API                    | New API           | Notes                      |
| -------------------------- | ----------------- | -------------------------- |
| `ajora.messages[threadId]` | `agent.messages`  | Filter by `agent.threadId` |
| `ajora.activeThreadId`     | `agent.threadId`  | Direct mapping             |
| `ajora.isThinking`         | `agent.isRunning` | Similar concept            |
| `ajora.threads`            | Custom hook       | Manage separately          |

#### Methods

| Old API                                  | New API                                        | Implementation      |
| ---------------------------------------- | ---------------------------------------------- | ------------------- |
| `submitQuery({ type: "text", message })` | `agent.addMessage()` + `copilotkit.runAgent()` | Convert and call    |
| `stopStreaming()`                        | `copilotkit.stopAgent()`                       | Direct mapping      |
| `switchThread(threadId)`                 | `agent.threadId = threadId`                    | Property assignment |
| `getMessages(threadId)`                  | Agent auto-loads                               | Or manual fetch     |

#### Events

| Old Event               | New Event                                | Handler                  |
| ----------------------- | ---------------------------------------- | ------------------------ |
| `onChunk` (SSE message) | `agent.subscribe({ onMessagesChanged })` | Subscribe to agent       |
| `onFunctionResponse`    | Tool call completion                     | Via `useRenderToolCall`  |
| `onThreadTitle`         | Custom event                             | May need runtime support |
| `onComplete`            | `agent.subscribe({ onRunFinalized })`    | Direct mapping           |

---

## Testing Strategy

### Unit Tests

1. **Adapters**
   - Message converter (bidirectional)
   - State adapter synchronization
   - SSE transport event mapping

2. **Hooks**
   - `useAgent` state management
   - `useThreads` thread switching
   - `useSuggestions` integration

3. **Components**
   - Message rendering
   - Tool call rendering
   - Input handling

### Integration Tests

1. **Chat Flow**
   - Send message → receive response
   - Tool execution flow
   - Error handling
   - Thread switching

2. **Real-time Updates**
   - Streaming messages
   - Incremental updates
   - Connection recovery

### E2E Tests

1. **User Scenarios**
   - Complete conversation
   - Tool interaction
   - Thread management
   - Attachment upload

---

## Rollout Plan

### Stage 1: Internal Testing (Week 13)

- [ ] Internal team testing
- [ ] Bug fixes
- [ ] Performance tuning

### Stage 2: Beta Release (Week 14)

- [ ] Release to beta users
- [ ] Collect feedback
- [ ] Address issues

### Stage 3: Gradual Migration (Weeks 15-16)

- [ ] Deprecate old API
- [ ] Migrate example apps
- [ ] Update documentation

### Stage 4: Full Release (Week 17)

- [ ] Remove compatibility layer (optional)
- [ ] Final documentation
- [ ] Announcement

---

## Risk Mitigation

### Technical Risks

| Risk                       | Impact | Mitigation                         |
| -------------------------- | ------ | ---------------------------------- |
| AG-UI protocol mismatch    | High   | Create comprehensive adapter layer |
| Performance degradation    | Medium | Benchmark early, optimize adapters |
| React Native compatibility | High   | Test on real devices early         |
| Breaking changes           | High   | Maintain compatibility layer       |

### Migration Risks

| Risk                | Impact | Mitigation                      |
| ------------------- | ------ | ------------------------------- |
| User adoption       | Medium | Provide clear migration guide   |
| API surface changes | High   | Maintain backward compatibility |
| Documentation gaps  | Low    | Comprehensive docs from start   |

---

## Success Criteria

### Functional

- ✅ All existing features work
- ✅ No breaking changes (with compat layer)
- ✅ Performance equal or better
- ✅ Test coverage >80%

### Technical

- ✅ Uses AG-UI protocol
- ✅ Integrates with CopilotKit v2.x
- ✅ Maintainable codebase
- ✅ Well documented

### User Experience

- ✅ Seamless migration path
- ✅ Clear documentation
- ✅ Working examples
- ✅ Support available

---

## Timeline Summary

| Phase                        | Duration     | Key Deliverables       |
| ---------------------------- | ------------ | ---------------------- |
| Phase 0: Preparation         | 1 week       | Setup, dependencies    |
| Phase 1: Core Infrastructure | 2 weeks      | Adapters, converters   |
| Phase 2: Provider Migration  | 1 week       | Providers, hooks       |
| Phase 3: Component Migration | 3 weeks      | UI components          |
| Phase 4: Feature Parity      | 2 weeks      | All features working   |
| Phase 5: Compatibility Layer | 1 week       | Backward compatibility |
| Phase 6: Testing & Polish    | 2 weeks      | Tests, docs            |
| **Total**                    | **12 weeks** | **Production ready**   |

---

## Next Steps

1. **Review & Approval**: Get stakeholder sign-off on plan
2. **Resource Allocation**: Assign developers to phases
3. **Kickoff Meeting**: Align team on approach
4. **Begin Phase 0**: Start preparation work

---

## Appendix

### A. Key Files to Migrate

**Core Logic:**

- `src/hooks/useAjora.tsx` → `packages/react-native/src/hooks/use-agent.tsx`
- `src/hooks/ajoraReducer.tsx` → Remove (use agent state)
- `src/api.ts` → `packages/react-native/src/adapters/sse-transport.ts`

**Components:**

- `src/Ajora/index.tsx` → `packages/react-native/src/components/CopilotChat.tsx`
- `src/MessageContainer/` → Reuse with adapters
- `src/InputToolbar/` → Reuse with adapters

**Providers:**

- `src/AjoraProvider.tsx` → `packages/react-native/src/providers/CopilotKitProvider.tsx`

### B. Dependencies to Add

```json
{
  "@copilotkitnext/core": "^2.x",
  "@copilotkitnext/react": "^2.x",
  "@ag-ui/client": "^latest"
}
```

### C. Dependencies to Remove (Eventually)

- Custom state management (replaced by agent)
- Custom API client (replaced by AG-UI)
- Message format converters (after migration)

### D. References

- [AG-UI Protocol Documentation](https://docs.ag-ui.com)
- [CopilotKit v2.x Documentation](https://docs.copilotkit.ai)
- [AbstractAgent API](https://docs.ag-ui.com/sdk/js/client/abstract-agent)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Author**: Migration Planning Team
