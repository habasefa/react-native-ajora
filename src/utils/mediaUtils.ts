import * as Linking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { IMessage } from "../../src/Ajora";

import { Alert } from "react-native";
import { Attachement } from "../hooks/useAjora";

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

export async function pickImageAsync(
  onAttachement: (attachement: Attachement) => void
) {
  const response = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!response.granted) return;

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    aspect: [4, 3],
  });

  if (result.canceled) return;

  onAttachement({
    displayName: result?.assets[0].fileName || "",
    mimeType: result?.assets[0].mimeType || "",
    fileUri: result?.assets[0].uri || "",
  });
}

export async function takePictureAsync(
  onAttachement: (attachement: Attachement) => void
) {
  const response = await ImagePicker.requestCameraPermissionsAsync();
  if (!response.granted) return;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    aspect: [4, 3],
  });

  if (result.canceled) return;

  onAttachement({
    displayName: result?.assets[0].fileName || "",
    mimeType: result?.assets[0].mimeType || "",
    fileUri: result?.assets[0].uri || "",
  });
}

export async function filePickerAsync(
  onAttachement: (attachement: Attachement) => void
) {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
  });
  if (result.canceled) return;
  const file = result.assets[0];
  onAttachement({
    displayName: file.name,
    mimeType: file.mimeType,
    fileUri: file.uri,
  });
}

export async function audioPickerAsync(
  onAttachement: (audios: Attachement) => void
) {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["audio/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return;

  const audioFile = result.assets[0];
  onAttachement({
    displayName: audioFile.name,
    mimeType: audioFile.mimeType,
    fileUri: audioFile.uri,
  });
}
