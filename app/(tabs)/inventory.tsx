import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Trees,
  Ruler,
  ArrowUpDown,
  Download,
  Trash2
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const API_BASE_URL = Platform.select({
  ios: 'http://192.168.46.104:5001',
  android: 'http://192.168.46.104:5001',
  default: 'http://localhost:5001',
});

// Define types for inventory items
interface InventoryItem {
  id: string;
  name: string;
  date: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  stats: {
    treeCount: number;
    avgDiameter: string;
    area: string;
  };
  processResults: {
    total_trees: number;
    tree_diameters: Record<string, number>;
    output_url: string;
  };
  mediaUri: string;
  mediaType: string;
}

export default function InventoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState('date');
  const [filterVisible, setFilterVisible] = useState(false);

  const fetchScans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/scans`);
      if (!response.ok) {
        throw new Error('Failed to fetch scans');
      }
      const data = await response.json();
      // Ensure data is an array and has the correct structure
      if (Array.isArray(data)) {
        setInventoryData(data);
      } else if (data && Array.isArray(data.scans)) {
        setInventoryData(data.scans);
      } else {
        setInventoryData([]);
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
      setError('Failed to load inventory data');
      setInventoryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      fetchScans();
    } else {
      const filtered = inventoryData.filter(item =>
        item.name.toLowerCase().includes(text.toLowerCase()) ||
        (item.location && 
          (item.location.latitude.toString().includes(text) || 
           item.location.longitude.toString().includes(text)))
      );
      setInventoryData(filtered);
    }
  };

  const handleSort = (order: string) => {
    let sorted = [...inventoryData];
    switch(order) {
      case 'date':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'treeCount':
        sorted.sort((a, b) => b.stats.treeCount - a.stats.treeCount);
        break;
      case 'area':
        sorted.sort((a, b) => parseFloat(b.stats.area) - parseFloat(a.stats.area));
        break;
    }
    setInventoryData(sorted);
    setSortOrder(order);
    setFilterVisible(false);
  };

  const exportData = async (format: string) => {
    if (Platform.OS === 'web') {
      alert('Export functionality is limited on web platform');
      return;
    }

    try {
      let content = '';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filename = '';

      if (format === 'csv') {
        content = 'ID,Name,Date,Location,Tree Count,Area,Avg Diameter\n';
        inventoryData.forEach(item => {
          const location = item.location 
            ? `${item.location.latitude}, ${item.location.longitude}`
            : 'N/A';
          content += `${item.id},"${item.name}",${item.date},"${location}",${item.stats.treeCount},"${item.stats.area}","${item.stats.avgDiameter}"\n`;
        });
        filename = `farm_inventory_${timestamp}.csv`;
      } else {
        content = JSON.stringify(inventoryData, null, 2);
        filename = `farm_inventory_${timestamp}.json`;
      }

      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        alert('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to delete this scan?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/scans/${id}`, {
                method: 'DELETE',
              });
              
              if (!response.ok) {
                throw new Error('Failed to delete scan');
              }
              
              // Refresh the inventory list
              await fetchScans();
            } catch (error) {
              console.error('Error deleting scan:', error);
              Alert.alert('Error', 'Failed to delete scan');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity
      style={styles.inventoryCard}
      onPress={() => router.push(`/inventory/${item.id}`)}
    >
      <Image
        source={{ uri: item.processResults.output_url }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 size={20} color="#D32F2F" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfoRow}>
          <View style={styles.infoItem}>
            <Calendar size={14} color="#757575" />
            <Text style={styles.infoText}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          {item.location && (
            <View style={styles.infoItem}>
              <MapPin size={14} color="#757575" />
              <Text style={styles.infoText}>
                {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Trees size={16} color="#2E7D32" />
            <Text style={styles.statValue}>{item.stats.treeCount}</Text>
            <Text style={styles.statLabel}>Trees</Text>
          </View>

          <View style={styles.statItem}>
            <Ruler size={16} color="#2E7D32" />
            <Text style={styles.statValue}>{item.stats.area}</Text>
            <Text style={styles.statLabel}>Area</Text>
          </View>

          <View style={styles.statItem}>
            <Ruler size={16} color="#2E7D32" />
            <Text style={styles.statValue}>{item.stats.avgDiameter}</Text>
            <Text style={styles.statLabel}>Avg Diameter</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>All scanned areas</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or location"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(!filterVisible)}
        >
          <Filter size={20} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchScans}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {filterVisible && (
            <View style={styles.filterOptions}>
              <Text style={styles.filterTitle}>Sort by:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.sortButton, sortOrder === 'date' && styles.activeSortButton]}
                  onPress={() => handleSort('date')}
                >
                  <Text style={[styles.sortButtonText, sortOrder === 'date' && styles.activeSortButtonText]}>Date</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortButton, sortOrder === 'name' && styles.activeSortButton]}
                  onPress={() => handleSort('name')}
                >
                  <Text style={[styles.sortButtonText, sortOrder === 'name' && styles.activeSortButtonText]}>Name</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortButton, sortOrder === 'treeCount' && styles.activeSortButton]}
                  onPress={() => handleSort('treeCount')}
                >
                  <Text style={[styles.sortButtonText, sortOrder === 'treeCount' && styles.activeSortButtonText]}>Tree Count</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortButton, sortOrder === 'area' && styles.activeSortButton]}
                  onPress={() => handleSort('area')}
                >
                  <Text style={[styles.sortButtonText, sortOrder === 'area' && styles.activeSortButtonText]}>Area</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.listHeader}>
            <View style={styles.listInfo}>
              <Text style={styles.listCount}>{inventoryData.length} scans</Text>
              <TouchableOpacity style={styles.sortIndicator} onPress={() => setFilterVisible(!filterVisible)}>
                <Text style={styles.sortText}>Sorted by: {sortOrder}</Text>
                <ArrowUpDown size={14} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => exportData('csv')}
              >
                <Download size={16} color="#2E7D32" />
                <Text style={styles.exportText}>CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => exportData('json')}
              >
                <Download size={16} color="#2E7D32" />
                <Text style={styles.exportText}>JSON</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={inventoryData}
            renderItem={renderInventoryItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No scans found</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#212121',
  },
  filterButton: {
    marginLeft: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterOptions: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  activeSortButton: {
    backgroundColor: '#E8F5E9',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#757575',
  },
  activeSortButtonText: {
    color: '#2E7D32',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  listInfo: {
    flexDirection: 'column',
  },
  listCount: {
    fontSize: 14,
    color: '#212121',
  },
  sortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sortText: {
    fontSize: 12,
    color: '#757575',
    marginRight: 4,
  },
  exportButtons: {
    flexDirection: 'row',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  exportText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  deleteButton: {
    padding: 8,
  },
  cardInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
  },
});
