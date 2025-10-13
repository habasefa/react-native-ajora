import { SafeAreaView } from "react-native-safe-area-context";
import { Ajora } from "../../src";
import { uploadToCloudinary } from "../services/fileUpload";
const App = () => {
  const onUpload = async (
    uri: string,
    onProgress?: (progress: number, isUploaded?: boolean) => void
  ) => {
    const uploadedUrl = await uploadToCloudinary(uri, onProgress);
    return uploadedUrl;
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
