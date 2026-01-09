// @ts-nocheck
import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { defineToolCallRenderer } from "../../lib/define-tool-call-renderer";

/**
 * WildcardToolCallRender for React Native.
 * Provides a fallback renderer for any tool call that doesn't have a specific renderer.
 */
export const WildcardToolCallRender = defineToolCallRenderer({
  name: "*",
  render: ({ args, result, name, status }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const isActive = status === "inProgress" || status === "executing";
    const isComplete = status === "complete";

    const statusStyles = isActive
      ? styles.statusActive
      : isComplete
      ? styles.statusComplete
      : styles.statusIdle;

    return (
       
      <View style={styles.container}>
        {/* @ts-ignore */}
        <View style={styles.card}>
          {/* @ts-ignore */}
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.header}
          >
            {/* @ts-ignore */}
            <View style={styles.headerLeft}>
              {/* @ts-ignore */}
              <Text style={[styles.arrow, isExpanded && styles.arrowExpanded]}>
                ▶
              </Text>
              {/* @ts-ignore */}
              <View style={styles.indicator} />
              {/* @ts-ignore */}
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
            </View>
            {/* @ts-ignore */}
            <View style={[styles.statusBadge, statusStyles]}>
              {/* @ts-ignore */}
              <Text style={[styles.statusText, isActive ? styles.statusTextActive : isComplete ? styles.statusTextComplete : styles.statusTextIdle]}>
                {String(status)}
              </Text>
            </View>
          </Pressable>

          {isExpanded && (
             
            <View style={styles.content}>
              {/* @ts-ignore */}
              <View style={styles.section}>
                {/* @ts-ignore */}
                <Text style={styles.sectionTitle}>Arguments</Text>
                {/* @ts-ignore */}
                <View style={styles.codeBlock}>
                  {/* @ts-ignore */}
                  <Text style={styles.codeText}>
                    {JSON.stringify(args ?? {}, null, 2)}
                  </Text>
                </View>
              </View>

              {result !== undefined && (
                 
                <View style={styles.section}>
                  {/* @ts-ignore */}
                  <Text style={styles.sectionTitle}>Result</Text>
                  {/* @ts-ignore */}
                  <View style={styles.codeBlock}>
                    {/* @ts-ignore */}
                    <Text style={styles.codeText}>
                      {typeof result === "string"
                        ? result
                        : JSON.stringify(result, null, 2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  },
});

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingBottom: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E7",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  arrow: {
    fontSize: 10,
    color: "#8E8E93",
    marginRight: 8,
  },
  arrowExpanded: {
    transform: [{ rotate: "90deg" }],
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: "#FFF7E6",
  },
  statusComplete: {
    backgroundColor: "#E6FFFA",
  },
  statusIdle: {
    backgroundColor: "#F2F2F7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#D48806",
  },
  statusTextComplete: {
    color: "#08979C",
  },
  statusTextIdle: {
    color: "#8E8E93",
  },
  content: {
    marginTop: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  codeBlock: {
    backgroundColor: "#F8F8F8",
    borderRadius: 6,
    padding: 8,
  },
  codeText: {
    fontSize: 12,
    fontFamily: "Courier",
    color: "#1C1C1E",
  },
});

export default WildcardToolCallRender;
