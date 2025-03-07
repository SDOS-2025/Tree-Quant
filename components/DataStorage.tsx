import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Types for inventory data
export interface TreeData {
  id: number;
  lat: number;
  lng: number;
  height: number;
  diameter: number;
  species: string;
  confidence: number;
}

export interface InventoryScan {
  id: string;
  name: string;
  date: string;
  location: string;
  coordinates: string;
  treeCount: number;
  area: string;
  avgHeight: string;
  avgDiameter: string;
  species: string[];
  confidence: number;
  notes?: string;
  image?: string;
  trees: TreeData[];
}

// Hook for managing inventory data
export const useInventoryStorage = () => {
  const [inventoryData, setInventoryData] = useState<InventoryScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load inventory data from storage
  const loadInventoryData = async () => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'web') {
        // For web, use localStorage
        const storedData = localStorage.getItem('farmInventoryData');
        if (storedData) {
          setInventoryData(JSON.parse(storedData));
        } else {
          // Initialize with mock data for demo
          setInventoryData(mockInventoryData);
          localStorage.setItem('farmInventoryData', JSON.stringify(mockInventoryData));
        }
      } else {
        // For native platforms, use FileSystem
        const inventoryDir = `${FileSystem.documentDirectory}inventory/`;
        const dirInfo = await FileSystem.getInfoAsync(inventoryDir);
        
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(inventoryDir, { intermediates: true });
          
          // Initialize with mock data for demo
          await FileSystem.writeAsStringAsync(
            `${inventoryDir}inventory.json`,
            JSON.stringify(mockInventoryData)
          );
          
          setInventoryData(mockInventoryData);
        } else {
          const fileUri = `${inventoryDir}inventory.json`;
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          
          if (fileInfo.exists) {
            const data = await FileSystem.readAsStringAsync(fileUri);
            setInventoryData(JSON.parse(data));
          } else {
            // Initialize with mock data if file doesn't exist
            await FileSystem.writeAsStringAsync(
              fileUri,
              JSON.stringify(mockInventoryData)
            );
            
            setInventoryData(mockInventoryData);
          }
        }
      }
    } catch (e) {
      console.error('Error loading inventory data', e);
      setError('Failed to load inventory data: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save inventory data to storage
  const saveInventoryData = async (data: InventoryScan[]) => {
    try {
      if (Platform.OS === 'web') {
        // For web, use localStorage
        localStorage.setItem('farmInventoryData', JSON.stringify(data));
      } else {
        // For native platforms, use FileSystem
        const inventoryDir = `${FileSystem.documentDirectory}inventory/`;
        await FileSystem.writeAsStringAsync(
          `${inventoryDir}inventory.json`,
          JSON.stringify(data)
        );
      }
      
      setInventoryData(data);
    } catch (e) {
      console.error('Error saving inventory data', e);
      setError('Failed to save inventory data: ' + e.message);
      throw e;
    }
  };

  // Add a new scan to inventory
  const addScan = async (scan: Omit<InventoryScan, 'id'>) => {
    try {
      const newScan: InventoryScan = {
        ...scan,
        id: Date.now().toString(),
      };
      
      const updatedData = [...inventoryData, newScan];
      await saveInventoryData(updatedData);
      
      return newScan;
    } catch (e) {
      console.error('Error adding scan', e);
      setError('Failed to add scan: ' + e.message);
      throw e;
    }
  };

  // Update an existing scan
  const updateScan = async (id: string, updates: Partial<InventoryScan>) => {
    try {
      const updatedData = inventoryData.map(scan => 
        scan.id === id ? { ...scan, ...updates } : scan
      );
      
      await saveInventoryData(updatedData);
    } catch (e) {
      console.error('Error updating scan', e);
      setError('Failed to update scan: ' + e.message);
      throw e;
    }
  };

  // Delete a scan
  const deleteScan = async (id: string) => {
    try {
      const updatedData = inventoryData.filter(scan => scan.id !== id);
      await saveInventoryData(updatedData);
    } catch (e) {
      console.error('Error deleting scan', e);
      setError('Failed to delete scan: ' + e.message);
      throw e;
    }
  };

  // Export inventory data
  const exportData = async (format: 'csv' | 'json') => {
    try {
      if (Platform.OS === 'web') {
        // For web, create a download link
        let content = '';
        let mimeType = '';
        let filename = '';
        
        if (format === 'csv') {
          content = 'ID,Name,Date,Location,Coordinates,Tree Count,Area,Avg Height,Avg Diameter,Species\n';
          inventoryData.forEach(item => {
            content += `${item.id},"${item.name}",${item.date},"${item.location}",${item.coordinates},${item.treeCount},"${item.area}","${item.avgHeight}","${item.avgDiameter}","${item.species.join(', ')}"\n`;
          });
          mimeType = 'text/csv';
          filename = 'farm_inventory.csv';
        } else {
          content = JSON.stringify(inventoryData, null, 2);
          mimeType = 'application/json';
          filename = 'farm_inventory.json';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
      } else {
        // For native platforms, use FileSystem and Sharing
        let content = '';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let filename = '';
        
        if (format === 'csv') {
          content = 'ID,Name,Date,Location,Coordinates,Tree Count,Area,Avg Height,Avg Diameter,Species\n';
          inventoryData.forEach(item => {
            content += `${item.id},"${item.name}",${item.date},"${item.location}",${item.coordinates},${item.treeCount},"${item.area}","${item.avgHeight}","${item.avgDiameter}","${item.species.join(', ')}"\n`;
          });
          filename = `farm_inventory_${timestamp}.csv`;
        } else {
          content = JSON.stringify(inventoryData, null, 2);
          filename = `farm_inventory_${timestamp}.json`;
        }
        
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, content);
        
        return fileUri;
      }
    } catch (e) {
      console.error('Error exporting data', e);
      setError('Failed to export data: ' + e.message);
      throw e;
    }
  };

  // Load data on initial mount
  useEffect(() => {
    loadInventoryData();
  }, []);

  return {
    inventoryData,
    isLoading,
    error,
    loadInventoryData,
    addScan,
    updateScan,
    deleteScan,
    exportData
  };
};

// Mock inventory data for initial setup
const mockInventoryData: InventoryScan[] = [
  {
    id: '1',
    name: 'North Orchard',
    date: '2025-06-10',
    location: 'North Farm',
    coordinates: '37.7850, -122.4024',
    treeCount: 124,
    area: '2.3 hectares',
    avgHeight: '8.3 meters',
    avgDiameter: '32 cm',
    species: ['Oak', 'Pine', 'Maple'],
    confidence: 92,
    notes: 'Healthy orchard with good growth. Some trees showing signs of new growth after spring pruning.',
    image: 'https://images.unsplash.com/photo-1501084291732-13b1ba8f0ebc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    trees: [
      { id: 1, lat: 37.7850, lng: -122.4024, height: 8.2, diameter: 34, species: 'Oak', confidence: 0.92 },
      { id: 2, lat: 37.7852, lng: -122.4026, height: 7.8, diameter: 28, species: 'Pine', confidence: 0.88 },
      { id: 3, lat: 37.7849, lng: -122.4028, height: 9.1, diameter: 36, species: 'Maple', confidence: 0.94 },
    ]
  },
  {
    id: '2',
    name: 'South Vineyard',
    date: '2025-06-08',
    location: 'South Farm',
    coordinates: '37.7830, -122.4050',
    treeCount: 86,
    area: '1.8 hectares',
    avgHeight: '7.5 meters',
    avgDiameter: '28 cm',
    species: ['Oak', 'Willow'],
    confidence: 88,
    notes: 'Recently planted area showing good initial growth. Some areas need additional irrigation.',
    image: 'https://images.unsplash.com/photo-1559944554-62a2b8f6c8b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    trees: [
      { id: 1, lat: 37.7830, lng: -122.4050, height: 7.5, diameter: 30, species: 'Oak', confidence: 0.90 },
      { id: 2, lat: 37.7832, lng: -122.4052, height: 7.2, diameter: 26, species: 'Willow', confidence: 0.85 },
    ]
  },
];