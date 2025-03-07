import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
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
  Download
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Mock inventory data
const mockInventoryData = [
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
    image: 'https://images.unsplash.com/photo-1501084291732-13b1ba8f0ebc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
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
    image: 'https://images.unsplash.com/photo-1559944554-62a2b8f6c8b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
  },
  {
    id: '3',
    name: 'East Forest Edge',
    date: '2025-06-05',
    location: 'East Farm',
    coordinates: '37.7870, -122.4000',
    treeCount: 156,
    area: '3.2 hectares',
    avgHeight: '9.1 meters',
    avgDiameter: '35 cm',
    species: ['Pine', 'Maple', 'Birch'],
    image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80'
  },
  {
    id: '4',
    name: 'West Hillside',
    date: '2025-06-01',
    location: 'West Farm',
    coordinates: '37.7840, -122.4080',
    treeCount: 92,
    area: '1.9 hectares',
    avgHeight: '8.0 meters',
    avgDiameter: '30 cm',
    species: ['Oak', 'Elm'],
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2232&q=80'
  },
];

export default function InventoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryData, setInventoryData] = useState(mockInventoryData);
  const [sortOrder, setSortOrder] = useState('date');
  const [filterVisible, setFilterVisible] = useState(false);
  
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setInventoryData(mockInventoryData);
    } else {
      const filtered = mockInventoryData.filter(item => 
        item.name.toLowerCase().includes(text.toLowerCase()) ||
        item.location.toLowerCase().includes(text.toLowerCase()) ||
        item.species.some(s => s.toLowerCase().includes(text.toLowerCase()))
      );
      setInventoryData(filtered);
    }
  };
  
  const handleSort = (order) => {
    let sorted = [...inventoryData];
    
    switch(order) {
      case 'date':
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'treeCount':
        sorted.sort((a, b) => b.treeCount - a.treeCount);
        break;
      case 'area':
        sorted.sort((a, b) => parseFloat(b.area) - parseFloat(a.area));
        break;
    }
    
    setInventoryData(sorted);
    setSortOrder(order);
    setFilterVisible(false);
  };
  
  const exportData = async (format) => {
    if (Platform.OS === 'web') {
      alert('Export functionality is limited on web platform');
      return;
    }
    
    try {
      let content = '';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filename = '';
      
      if (format === 'csv') {
        // Create CSV content
        content = 'ID,Name,Date,Location,Coordinates,Tree Count,Area,Avg Height,Avg Diameter,Species\n';
        inventoryData.forEach(item => {
          content += `${item.id},"${item.name}",${item.date},"${item.location}",${item.coordinates},${item.treeCount},"${item.area}","${item.avgHeight}","${item.avgDiameter}","${item.species.join(', ')}"\n`;
        });
        filename = `farm_inventory_${timestamp}.csv`;
      } else {
        // Create JSON content
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
  
  const renderInventoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.inventoryCard}
      onPress={() => router.push(`/inventory/${item.id}`)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        
        <View style={styles.cardInfoRow}>
          <View style={styles.infoItem}>
            <Calendar size={14} color="#757575" />
            <Text style={styles.infoText}>{item.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <MapPin size={14} color="#757575" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Trees size={16} color="#2E7D32" />
            <Text style={styles.statValue}>{item.treeCount}</Text>
            <Text style={styles.statLabel}>Trees</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ruler size={16} color="#2E7D32" />
            <Text style={styles.statValue}>{item.area}</Text>
            <Text style={styles.statLabel}>Area</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ruler size={16} color="#2E7D32" />
            <Text style={styles.statValue}>{item.avgHeight}</Text>
            <Text style={styles.statLabel}>Avg Height</Text>
          </View>
        </View>
        
        <View style={styles.speciesContainer}>
          {item.species.map((species, index) => (
            <View key={index} style={styles.speciesTag}>
              <Text style={styles.speciesText}>{species}</Text>
            </View>
          ))}
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
            placeholder="Search by name, location, or species"
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
      />
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
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#212121',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
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
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Medium',
    fontSize: 16,
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
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212121',
  },
  sortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sortText: {
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Medium',
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
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#212121',
    marginBottom: 8,
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
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#212121',
    marginTop: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#757575',
  },
  speciesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  speciesTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  speciesText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#2E7D32',
  },
});