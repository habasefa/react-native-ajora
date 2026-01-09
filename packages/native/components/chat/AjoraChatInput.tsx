// @ts-nocheck
import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { WithSlots } from "../../lib/slots";

export type AjoraChatInputMode = "input" | "transcribe" | "processing";

export type AjoraChatInputProps = {
  mode?: AjoraChatInputMode;
  onSubmitMessage?: (value: string) => void;
  onStop?: () => void;
  isRunning?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

export function AjoraChatInput({
  mode = "input",
  onSubmitMessage,
  onStop,
  isRunning = false,
  value,
  onChange,
  style,
}: AjoraChatInputProps) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : internalValue;

  const handleChangeText = (text: string) => {
    if (!isControlled) {
      setInternalValue(text);
    }
    onChange?.(text);
  };

  const handleSend = () => {
    if (resolvedValue.trim() && onSubmitMessage) {
      onSubmitMessage(resolvedValue.trim());
      if (!isControlled) {
        setInternalValue("");
      }
      onChange?.("");
    }
  };

  const handleStop = () => {
    onStop?.();
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        value={resolvedValue}
        onChangeText={handleChangeText}
        placeholder="Type a message..."
        editable={!isRunning}
      />
      {isRunning ? (
        <Button title="Stop" onPress={handleStop} color="red" />
      ) : (
        <Button title="Send" onPress={handleSend} disabled={!resolvedValue.trim()} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
});

export default AjoraChatInput;
