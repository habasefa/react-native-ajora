import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export interface AjoraChatAudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isRunning?: boolean;
}

/**
 * Placeholder for AjoraChatAudioRecorder in React Native.
 * TODO: Implement native audio recording using a library like `react-native-audio-recorder-player` or `expo-av`.
 */
export function AjoraChatAudioRecorder({
  onRecordingComplete,
  isRunning = false,
}: AjoraChatAudioRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      console.log("Stopping recording... (Placeholder)");
      setIsRecording(false);
    } else {
      console.log("Starting recording... (Placeholder)");
      setIsRecording(true);
    }
  };

  return (
     
    <View style={styles.container}>
      {/* @ts-ignore */}
      <Pressable
        onPress={toggleRecording}
        style={[styles.button, isRecording && styles.buttonRecording]}
        disabled={isRunning}
      >
        {/* @ts-ignore */}
        <Text style={styles.buttonText}>
          {isRecording ? "Stop Recording" : "Start Voice Input"}
        </Text>
      </Pressable>
      {isRecording && (
         
        <Text style={styles.statusText}>Recording...</Text>
      )}
      {/* @ts-ignore */}
      <Text style={styles.todoText}>
        [TODO: Integrate with native audio recording library]
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginVertical: 5,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#3B82F6",
    borderRadius: 5,
  },
  buttonRecording: {
    backgroundColor: "#EF4444",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  statusText: {
    marginTop: 5,
    color: "#EF4444",
    fontSize: 12,
  },
  todoText: {
    marginTop: 5,
    color: "#9CA3AF",
    fontSize: 10,
    fontStyle: "italic",
  },
});

export default AjoraChatAudioRecorder;
