import { useEffect, useState } from "react";
import { Keyboard, Platform, KeyboardEvent } from "react-native";

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    function onKeyboardDidShow(e: KeyboardEvent) {
      setKeyboardHeight(e.endCoordinates.height);
    }

    function onKeyboardDidHide() {
      setKeyboardHeight(0);
    }

    // Android/iOS differences in event naming
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardDidShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardDidHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
}
