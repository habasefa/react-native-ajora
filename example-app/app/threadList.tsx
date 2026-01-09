import { StyleSheet, Text, View } from "react-native";
import React from "react";

const ChatListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chat List</Text>
    </View>
  );
};

export default ChatListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
