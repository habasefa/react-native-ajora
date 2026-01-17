import { Platform } from "react-native";

export const MIN_COMPOSER_HEIGHT = Platform.select({
  ios: 28,
  android: 40,
  web: 28,
  windows: 28,
});
export const MAX_COMPOSER_HEIGHT = 200;
export const DEFAULT_PLACEHOLDER = "Type a message...";
export const DATE_FORMAT = "D MMMM";
export const TIME_FORMAT = "LT";

export const TEST_ID = {
  WRAPPER: "GC_WRAPPER",
  LOADING_WRAPPER: "GC_LOADING_CONTAINER",
  SEND_TOUCHABLE: "GC_SEND_TOUCHABLE",
};
