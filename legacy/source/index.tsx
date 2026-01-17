import { Text, View } from "react-native";
import React from "react";
import { SourceProps } from "./types";

const Source = ({ id, name, content, url }: SourceProps) => {
  return (
    <View>
      <Text>{name}</Text>
      <Text>{content}</Text>
      <Text>{url}</Text>
    </View>
  );
};

export default Source;
