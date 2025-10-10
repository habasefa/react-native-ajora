import { SafeAreaView } from "react-native-safe-area-context";
import { Ajora } from "../../src";
const App = () => {
  const onUpload = async (
    uri: string,
    onProgress?: (progress: number, isUploaded?: boolean) => void
  ) => {
    console.info("onUpload in index.tsx", { uri, progress: 0 });

    try {
      // Mock upload by incrementing the progress every 1 second
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        if (onProgress) {
          onProgress(currentProgress);
        }

        // Complete the upload when progress reaches 100
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          // Mark as uploaded when complete
          if (onProgress) {
            onProgress(100, true); // Pass true to indicate upload is complete
          }
        }
      }, 1000);

      return uri;
    } catch (error) {
      console.error("Upload failed:", error);
      // You could show an error state here
      throw error;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
