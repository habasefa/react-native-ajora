import * as Linking from "expo-linking";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { IMessage } from "../../src/Ajora";

import { Alert } from "react-native";

export default async function getPermissionAsync(
  permission: "camera" | "mediaLibrary" | "location"
) {
  let status = "granted";

  switch (permission) {
    case "camera":
      const cameraResponse = await ImagePicker.requestCameraPermissionsAsync();
      status = cameraResponse.status;
      break;
    case "mediaLibrary":
      const mediaResponse =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = mediaResponse.status;
      break;
    case "location":
      const locationResponse =
        await Location.requestForegroundPermissionsAsync();
      status = locationResponse.status;
      break;
  }

  if (status !== "granted") {
    const permissionName = permission.toLowerCase().replace("_", " ");
    Alert.alert(
      "Cannot be done 😞",
      `If you would like to use this feature, you'll need to enable the ${permissionName} permission in your phone settings.`,
      [
        {
          text: "Let's go!",
          onPress: () => Linking.openURL("app-settings:"),
        },
        { text: "Nevermind", onPress: () => {}, style: "cancel" },
      ],
      { cancelable: true }
    );

    return false;
  }
  return true;
}

export async function pickImageAsync(onSend: (messages: IMessage[]) => void) {
  const response = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!response.granted) return;

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled) return;

  const images = result.assets.map(({ uri: image }) => ({ image }));
  onSend([
    {
      _id: "1",
      thread_id: "1",
      role: "user",
      parts: [
        {
          fileData: {
            fileUri: images[0].image,
            mimeType: "image/jpeg",
          },
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ]);
}

export async function takePictureAsync(onSend: (images: IMessage[]) => void) {
  const response = await ImagePicker.requestCameraPermissionsAsync();
  if (!response.granted) return;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled) return;

  const images = result.assets.map(({ uri: image }) => ({ image }));
  onSend([
    {
      _id: "1",
      thread_id: "1",
      role: "user",
      parts: [
        {
          fileData: {
            fileUri: images[0].image,
            mimeType: "image/jpeg",
          },
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ]);
}

export async function filePickerAsync(onSend: (files: IMessage[]) => void) {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
  });
  if (result.canceled) return;
  const file = result.assets[0];
  onSend([
    {
      _id: "1",
      thread_id: "1",
      role: "user",
      parts: [
        {
          fileData: {
            fileUri: file.uri,
            mimeType: file.mimeType,
          },
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ]);
}

export async function audioPickerAsync(onSend: (audios: IMessage[]) => void) {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["audio/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return;

  const audioFile = result.assets[0];

  onSend([
    {
      _id: "1",
      thread_id: "1",
      role: "user",
      parts: [
        {
          fileData: {
            fileUri: audioFile.uri,
            mimeType: audioFile.mimeType,
          },
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ]);
}
