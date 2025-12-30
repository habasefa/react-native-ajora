import { StyleSheet, ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

const Home = () => {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemeSwitcher />
        </ThemedView>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          style={styles.scrollView}
        >
          <ThemedView style={styles.welcomeSection}>
            <ThemedText type="title">Welcome to Ajora</ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },

  contentContainer: {
    padding: 20,
  },
  welcomeSection: {
    marginTop: 32,
    alignItems: "center",
  },
});
