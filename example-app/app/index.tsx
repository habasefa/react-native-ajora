import { SafeAreaView } from "react-native-safe-area-context";
import { Ajora } from "../../src";
const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Ajora
        isScrollToBottomEnabled
        keyboardShouldPersistTaps="never"
        infiniteScroll
      />
    </SafeAreaView>
  );
};

export default App;
