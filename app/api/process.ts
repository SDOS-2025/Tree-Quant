import { API_BASE_URL } from '../config'; // Import the centralized URL

/* Remove old definition
const API_BASE_URL = "http://192.168.45.197:5001/api/process"; // Replace YOUR_LOCAL_IP
*/

export async function processImage(imageId: string) {
  // Construct the full URL using the base URL
  const url = `${API_BASE_URL}/api/process`; 
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
