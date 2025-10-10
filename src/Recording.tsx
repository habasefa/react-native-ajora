import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Alert } from "react-native";
let useAudioRecorder: any = null;
let AudioModule: any = null;
let RecordingPresets: any = null;
let setAudioModeAsync: any = null;
let useAudioRecorderState: any = null;

try {
  const expoAudio = require("expo-audio");
  useAudioRecorder = expoAudio.useAudioRecorder;
  AudioModule = expoAudio.AudioModule;
  RecordingPresets = expoAudio.RecordingPresets;
  setAudioModeAsync = expoAudio.setAudioModeAsync;
  useAudioRecorderState = expoAudio.useAudioRecorderState;
} catch (error) {
  console.warn("expo-audio not available, recording will be disabled");
}
import { useChatContext } from "./AjoraContext";
import Color from "./Color";

export function RecordingView() {
  const { ajora } = useChatContext();
  const [audioLevels, setAudioLevels] = useState<number[]>([]);

  const levelInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio recorder with proper error handling
  const audioRecorder = useAudioRecorder
    ? useAudioRecorder(RecordingPresets?.HIGH_QUALITY)
    : null;
  const recorderState = useAudioRecorderState
    ? useAudioRecorderState(audioRecorder)
    : null;

  const onStop = () => {
    ajora.setIsRecording(false);
  };

  // Setup permissions and audio mode when component mounts
  useEffect(() => {
    if (!AudioModule || !setAudioModeAsync) {
      console.warn("Audio recording not available");
      onStop();
      return;
    }

    const setupAudio = async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert("Permission to access microphone was denied");
          onStop();
          return;
        }

        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });

        // Start recording automatically
        await startRecording();
      } catch (error) {
        console.error("Failed to setup audio:", error);
        onStop();
      }
    };

    setupAudio();

    return () => {
      stopRecording();
    };
  }, []);

  // Update visualizer when recording state changes
  useEffect(() => {
    if (recorderState?.isRecording) {
      // Start audio level simulation
      levelInterval.current = setInterval(() => {
        const level = Math.random() * 100; // Simulate audio level
        setAudioLevels((prev) => [...prev.slice(-20), level]); // Keep last 20 levels
      }, 100);
    } else {
      // Clean up intervals when not recording
      if (levelInterval.current) {
        clearInterval(levelInterval.current);
        levelInterval.current = null;
      }
    }
  }, [recorderState?.isRecording]);

  const startRecording = async () => {
    try {
      if (!audioRecorder) {
        console.warn("Audio recorder not available");
        onStop();
        return;
      }

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error("Failed to start recording:", error);
      onStop();
    }
  };

  const stopRecording = async () => {
    try {
      if (audioRecorder && recorderState?.isRecording) {
        await audioRecorder.stop();

        // Get the recording URI
        const uri = audioRecorder.uri;
        if (uri) {
          // Create attachment from recording
          const attachment = {
            displayName: `Recording_${new Date().toISOString().replace(/[:.]/g, "-")}.m4a`,
            mimeType: "audio/m4a",
            fileUri: uri,
            size: 0, // Size will be calculated when needed
          };

          ajora.setAttachement(attachment);
        }
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
    } finally {
      onStop();
    }
  };

  // Don't render if audio recording is not available
  if (!audioRecorder || !recorderState) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Audio recording not available</Text>
      </View>
    );
  }

  // Debug: Log recording state
  console.log("RecordingView render - isRecording:", recorderState.isRecording);

  return (
    <View style={styles.container}>
      {/* Audio level visualization - perfectly centered */}
      <View style={styles.visualizer}>
        {audioLevels.map((level, index) => {
          const barHeight = Math.max(8, (level / 100) * 50);
          const isEven = index % 2 === 0;
          const isHighLevel = level > 70;
          const isMediumLevel = level > 40;

          // Create color variation based on level and position
          let barColor = Color.foreground; // Use blackish foreground color
          if (isHighLevel) {
            barColor = Color.foreground; // Use foreground for high levels too
          } else if (isMediumLevel) {
            barColor = Color.foreground; // Use foreground for medium levels
          } else if (isEven) {
            barColor = Color.foreground;
          } else {
            barColor = Color.foreground; // Use foreground for all bars for consistency
          }

          return (
            <View
              key={index}
              style={[
                styles.barContainer,
                {
                  height: 60, // Fixed container height
                },
              ]}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    opacity: 0.5 + (level / 100) * 0.5,
                    backgroundColor: barColor,
                    transform: [{ scaleY: 1 + (level / 100) * 0.2 }], // Subtle scale effect
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  visualizer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 40, // Push the visualizer down a bit
  },
  barContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 1,
  },
  bar: {
    width: "100%",
    borderRadius: 12,
    minHeight: 8,
    shadowColor: Color.foreground,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  errorText: {
    fontSize: 16,
    color: Color.destructive,
    textAlign: "center",
    fontWeight: "500",
  },
});
