export async function uploadToCloudinary(image: any) {
  // If image.base64 is provided, you can use it; else use the URI + blob approach
  const data = new FormData();

  if (image.base64) {
    data.append("file", `data:${image.type};base64,${image.base64}`);
  } else {
    data.append("file", {
      uri: image.uri as string,
      type: image.type || "image/jpeg",
      name: image.fileName || `upload.${image.uri.split(".").pop()}`,
    } as any);
  }

  data.append("upload_preset", "ajora-agent");
  data.append("cloud_name", "ajora");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/ajora/image/upload`,
    {
      method: "POST",
      body: data,
    }
  );
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
  const json = await response.json();
  return json.secure_url;
}
