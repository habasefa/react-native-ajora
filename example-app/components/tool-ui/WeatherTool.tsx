import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ToolRequest, ToolResponse } from "../../../src/Tool/types";

interface WeatherToolProps {
  request: ToolRequest;
  onResponse?: (response: ToolResponse) => void;
}

const WeatherTool: React.FC<WeatherToolProps> = ({ request, onResponse }) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { tool } = request;
  const { location, units = "celsius" } = tool.args || {};

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call - in real implementation, you'd call an actual weather API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock weather data
      const mockWeather = {
        location: location || "Unknown",
        temperature: Math.floor(Math.random() * 30) + 5,
        units: units,
        condition: ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"][
          Math.floor(Math.random() * 4)
        ],
        humidity: Math.floor(Math.random() * 40) + 30,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        description: `Current weather in ${location || "the area"}`,
      };

      setWeather(mockWeather);

      // Send response back
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: mockWeather,
        });
      }
    } catch {
      setError("Failed to fetch weather data");
      if (onResponse && request) {
        onResponse({
          callId: request.callId,
          response: { error: "Failed to fetch weather data" },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [location, units, request, onResponse]);

  useEffect(() => {
    if (request?.tool.name === "get_weather") {
      // Use response data from the merged functionCall
      if (request.tool.response) {
        setWeather(request.tool.response);
        setLoading(false);
      } else {
        setLoading(true);
        setError(null);
      }
    }
  }, [request]);

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No request provided</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>
            Getting weather for {location}...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchWeather}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.weatherCard}>
        <View style={styles.header}>
          <Text style={styles.locationIcon}>🌤️</Text>
          <Text style={styles.locationText}>{weather.location}</Text>
        </View>

        <View style={styles.temperatureContainer}>
          <Text style={styles.temperature}>
            {weather.temperature}°{units === "celsius" ? "C" : "F"}
          </Text>
          <Text style={styles.condition}>{weather.condition}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💧</Text>
            <Text style={styles.detailText}>Humidity: {weather.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💨</Text>
            <Text style={styles.detailText}>
              Wind: {weather.windSpeed} km/h
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{weather.description}</Text>
      </View>
    </View>
  );
};

WeatherTool.displayName = "get_weather";
export default WeatherTool;

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#dc2626",
    borderRadius: 6,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  weatherCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  temperatureContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  temperature: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  condition: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#6b7280",
  },
  description: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
  },
});
