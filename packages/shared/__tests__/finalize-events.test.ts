import { EventType, BaseEvent, RunErrorEvent } from "@ag-ui/client";
import { finalizeRunEvents } from "../finalize-events";

function event(type: EventType, extra: Record<string, unknown> = {}): BaseEvent {
  return { type, ...extra } as BaseEvent;
}

describe("finalizeRunEvents", () => {
  describe("complete streams (no patching needed)", () => {
    it("returns empty array when stream already has RUN_FINISHED", () => {
      const events: BaseEvent[] = [
        event(EventType.TEXT_MESSAGE_START, { messageId: "m1" }),
        event(EventType.TEXT_MESSAGE_END, { messageId: "m1" }),
        event(EventType.RUN_FINISHED),
      ];
      const appended = finalizeRunEvents(events);
      expect(appended).toEqual([]);
    });

    it("returns empty array when stream has RUN_ERROR", () => {
      const events: BaseEvent[] = [
        event(EventType.RUN_ERROR),
      ];
      const appended = finalizeRunEvents(events);
      expect(appended).toEqual([]);
    });
  });

  describe("open text messages", () => {
    it("closes an open text message with TEXT_MESSAGE_END", () => {
      const events: BaseEvent[] = [
        event(EventType.TEXT_MESSAGE_START, { messageId: "m1" }),
        event(EventType.RUN_FINISHED),
      ];
      const appended = finalizeRunEvents(events);
      expect(appended).toHaveLength(1);
      expect(appended[0]).toMatchObject({
        type: EventType.TEXT_MESSAGE_END,
        messageId: "m1",
      });
    });

    it("does not close a message that already has TEXT_MESSAGE_END", () => {
      const events: BaseEvent[] = [
        event(EventType.TEXT_MESSAGE_START, { messageId: "m1" }),
        event(EventType.TEXT_MESSAGE_END, { messageId: "m1" }),
        event(EventType.RUN_FINISHED),
      ];
      const appended = finalizeRunEvents(events);
      expect(appended).toEqual([]);
    });
  });

  describe("open tool calls", () => {
    it("closes an open tool call with TOOL_CALL_END", () => {
      const events: BaseEvent[] = [
        event(EventType.TOOL_CALL_START, { toolCallId: "tc1" }),
        event(EventType.RUN_FINISHED),
      ];
      const appended = finalizeRunEvents(events);
      expect(appended.some((e) => e.type === EventType.TOOL_CALL_END)).toBe(true);
    });

    it("does not duplicate TOOL_CALL_END if already present", () => {
      const events: BaseEvent[] = [
        event(EventType.TOOL_CALL_START, { toolCallId: "tc1" }),
        event(EventType.TOOL_CALL_END, { toolCallId: "tc1" }),
        event(EventType.TOOL_CALL_RESULT, { toolCallId: "tc1" }),
        event(EventType.RUN_FINISHED),
      ];
      const appended = finalizeRunEvents(events);
      expect(appended).toEqual([]);
    });
  });

  describe("missing terminal event", () => {
    it("appends RUN_ERROR when stream ends abruptly", () => {
      const events: BaseEvent[] = [
        event(EventType.TEXT_MESSAGE_START, { messageId: "m1" }),
      ];
      const appended = finalizeRunEvents(events);
      expect(appended.some((e) => e.type === EventType.RUN_ERROR)).toBe(true);
      const runError = appended.find(
        (e) => e.type === EventType.RUN_ERROR,
      ) as RunErrorEvent;
      expect(runError.message).toContain("ended without emitting");
    });

    it("appends RUN_FINISHED when stopRequested is true", () => {
      const events: BaseEvent[] = [
        event(EventType.TEXT_MESSAGE_START, { messageId: "m1" }),
      ];
      const appended = finalizeRunEvents(events, { stopRequested: true });
      expect(appended.some((e) => e.type === EventType.RUN_FINISHED)).toBe(true);
      expect(appended.some((e) => e.type === EventType.RUN_ERROR)).toBe(false);
    });
  });

  describe("open tool calls without terminal event", () => {
    it("injects TOOL_CALL_RESULT for open tool calls missing results", () => {
      const events: BaseEvent[] = [
        event(EventType.TOOL_CALL_START, { toolCallId: "tc1" }),
      ];
      const appended = finalizeRunEvents(events);
      const result = appended.find((e) => e.type === EventType.TOOL_CALL_RESULT);
      expect(result).toBeDefined();
      expect((result as any).toolCallId).toBe("tc1");
      const content = JSON.parse((result as any).content);
      expect(content.status).toBe("error");
      expect(content.reason).toBe("missing_terminal_event");
    });

    it("injects 'stopped' result when stopRequested", () => {
      const events: BaseEvent[] = [
        event(EventType.TOOL_CALL_START, { toolCallId: "tc1" }),
      ];
      const appended = finalizeRunEvents(events, { stopRequested: true });
      const result = appended.find((e) => e.type === EventType.TOOL_CALL_RESULT);
      expect(result).toBeDefined();
      const content = JSON.parse((result as any).content);
      expect(content.status).toBe("stopped");
      expect(content.reason).toBe("stop_requested");
    });

    it("does not inject result if tool already has TOOL_CALL_RESULT", () => {
      const events: BaseEvent[] = [
        event(EventType.TOOL_CALL_START, { toolCallId: "tc1" }),
        event(EventType.TOOL_CALL_RESULT, { toolCallId: "tc1" }),
      ];
      const appended = finalizeRunEvents(events);
      // Should still get TOOL_CALL_END and RUN_ERROR, but no extra TOOL_CALL_RESULT
      expect(
        appended.filter((e) => e.type === EventType.TOOL_CALL_RESULT),
      ).toHaveLength(0);
    });
  });

  describe("interruptionMessage option", () => {
    it("uses custom interruptionMessage in stop message", () => {
      const events: BaseEvent[] = [
        event(EventType.TOOL_CALL_START, { toolCallId: "tc1" }),
      ];
      const appended = finalizeRunEvents(events, {
        stopRequested: true,
        interruptionMessage: "Agent was cancelled",
      });
      const result = appended.find((e) => e.type === EventType.TOOL_CALL_RESULT);
      const content = JSON.parse((result as any).content);
      expect(content.message).toBe("Agent was cancelled");
    });
  });

  describe("multiple open items", () => {
    it("handles multiple open messages and tool calls", () => {
      const events: BaseEvent[] = [
        event(EventType.TEXT_MESSAGE_START, { messageId: "m1" }),
        event(EventType.TOOL_CALL_START, { toolCallId: "tc1" }),
        event(EventType.TEXT_MESSAGE_START, { messageId: "m2" }),
        event(EventType.TOOL_CALL_START, { toolCallId: "tc2" }),
      ];
      const appended = finalizeRunEvents(events);

      // Both messages should be closed
      const messageEnds = appended.filter(
        (e) => e.type === EventType.TEXT_MESSAGE_END,
      );
      expect(messageEnds).toHaveLength(2);

      // Both tool calls should get END and RESULT
      const toolEnds = appended.filter(
        (e) => e.type === EventType.TOOL_CALL_END,
      );
      expect(toolEnds).toHaveLength(2);

      const toolResults = appended.filter(
        (e) => e.type === EventType.TOOL_CALL_RESULT,
      );
      expect(toolResults).toHaveLength(2);

      // Terminal event
      expect(appended.some((e) => e.type === EventType.RUN_ERROR)).toBe(true);
    });
  });
});
