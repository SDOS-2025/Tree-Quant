const API_BASE_URL = "http://192.168.45.197:5001/api/process"; // Replace YOUR_LOCAL_IP

export async function processImage(imageId: string) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageId }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to process image");
  }
  
  return response.json();
}
