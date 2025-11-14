import { Ajora } from "../../src";
import { uploadToCloudinary } from "../services/fileUpload";
import { OnUploadProps } from "../../src/Actions";
import { Header } from "@/components/header";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Theme values (self-contained)
const colors = {
  appPrimary: "#4095E5",
  appSecondary: "#F3F4F6",
  text: "#1F2937",
  primaryText: "#111827",
  secondaryText: "#6B7280",
  background: "#F9FAFB",
  white: "#FFFFFF",
  border: "#E5E7EB",
  shadow: "#000000",
};

const App = () => {
  const onUpload = async ({
    file,
    onProgress,
    onSuccess,
    onError,
  }: OnUploadProps) => {
    try {
      const { fileUri } = file;
      const uploadedUrl = await uploadToCloudinary(fileUri, onProgress);
      onProgress?.(100, true);
      onSuccess?.(uploadedUrl);
    } catch (error) {
      onError?.(error);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Header
        onLeftPress={() => {
          router.push("/threadList");
        }}
      />
      <Ajora
        isScrollToBottomEnabled
        keyboardShouldPersistTaps="never"
        infiniteScroll
        onUpload={onUpload}
      />
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
