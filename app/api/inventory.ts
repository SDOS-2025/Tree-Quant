const API_BASE_URL = "http://192.168.45.197:5001/api/inventory"; // Replace YOUR_LOCAL_IP

export async function addInventoryItem(item: {
  name: string;
  area: number;
  treeCount: number;
  avgDiameter: number;
}) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error("Failed to add inventory item");
  }
  return response.json();
}

export async function getInventoryItems() {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch inventory items");
  }
  return response.json();
}
