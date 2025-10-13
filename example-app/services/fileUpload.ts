import { UploadApiOptions, upload } from "cloudinary-react-native";
import { Cloudinary } from "@cloudinary/url-gen";

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_FOLDER = process.env.EXPO_PUBLIC_CLOUDINARY_FOLDER;

const cloudinary = new Cloudinary({
  cloud: {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  },
  url: {
    secure: true,
  },
});

export async function uploadToCloudinary(
  fileUri: string,
  onProgress?: (progress: number, isUploaded?: boolean) => void
): Promise<string> {
  const options: UploadApiOptions = {
    upload_preset: CLOUDINARY_UPLOAD_PRESET,
    unsigned: true,
    folder: CLOUDINARY_FOLDER,
  };

  if (onProgress) onProgress(0);

  return new Promise<string>((resolve, reject) => {
    upload(cloudinary, {
      file: fileUri,
      options: options,
      callback: (error: any, response: any) => {
        if (error) {
          console.error("Upload failed:", error);
          reject(error);
          return;
        }

        if (response && response.secure_url) {
          if (onProgress) onProgress(100, true);
          resolve(response.secure_url as string);
          return;
        }

        const err = new Error("No response from Cloudinary");
        console.error("Upload failed:", err.message);
        reject(err);
      },
    });
  });
}
