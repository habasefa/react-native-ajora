import { SafeAreaView } from "react-native-safe-area-context";
import TimeTool from "@/components/tool-ui/TimeTool";
import WeatherTool from "@/components/tool-ui/WeatherTool";
import { Ajora } from "../../src";
const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Ajora
        isScrollToBottomEnabled
        keyboardShouldPersistTaps="never"
        infiniteScroll
        renderTools={() => [TimeTool, WeatherTool]}
      />
    </SafeAreaView>
  );
};

export default App;
