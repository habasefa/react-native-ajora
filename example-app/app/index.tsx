import { SafeAreaView } from "react-native-safe-area-context";
import { Ajora } from "../../src";
import { uploadToCloudinary } from "../services/fileUpload";
import { OnUploadProps } from "../../src/Actions";

const App = () => {
  const onUpload = async ({
    file,
    onProgress,
    onSuccess,
    onError,
  }: OnUploadProps) => {
    try {
      const { fileUri, displayName, mimeType } = file;
      const uploadedUrl = await uploadToCloudinary(fileUri, onProgress);
      onProgress?.(100, true);
      onSuccess?.(uploadedUrl);
    } catch (error) {
      onError?.(error);
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
