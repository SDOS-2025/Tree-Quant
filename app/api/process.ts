import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL as ConfiguredBaseUrl } from '../config'; // Use the configured URL

/* Remove old definition
const API_BASE_URL = "http://192.168.45.197:5001/api/process"; // Replace YOUR_LOCAL_IP
*/

export async function processImage(imageId: string) {
  // Construct the full URL using the base URL
  const url = `${ConfiguredBaseUrl}/api/process`; 
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageId }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to process image");
  }
  
  return response.json();
}

export const processImageWithBackend = async (fileUri: string, fileType: string) => {
  // Use the configured base URL
  // Ensure the endpoint path is correct. If ConfiguredBaseUrl already includes /api, adjust accordingly.
  let uploadUrl = ConfiguredBaseUrl.endsWith('/api') 
    ? `${ConfiguredBaseUrl}/tree-detection/process-image` 
    : `${ConfiguredBaseUrl}/api/tree-detection/process-image`;

  let result;
  if (Platform.OS === 'web') {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const formData = new FormData();
    const fileNameParts = fileUri.split('/');
    const fileName = fileNameParts[fileNameParts.length - 1];
    formData.append('image', blob, fileName);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData, // Added body back
    });
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }
    result = await uploadResponse.json();

  } else {
    const uploadResponse = await FileSystem.uploadAsync(
      uploadUrl, // Use uploadUrl
      fileUri,
      { // Added options object back
        fieldName: 'image',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        mimeType: fileType === 'video' ? 'video/mp4' : 'image/jpeg',
      }
    );
    if (uploadResponse.status !== 200) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }
    result = JSON.parse(uploadResponse.body);
  }

  // Return or process the result
  return result;
}
