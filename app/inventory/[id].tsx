import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Trees, 
  Ruler, 
  Download, 
  Share2, 
  Edit, 
  Trash2 
} from 'lucide-react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { PieChart } from 'react-native-chart-kit';

// Mock data for individual trees in a scan
const mockTreeDetails = [
  { id: 1, lat: 37.7850, lng: -122.4024, height: 8.2, diameter: 34, species: 'Oak', confidence: 0.92 },
  { id: 2, lat: 37.7852, lng: -122.4026, height: 7.8, diameter: 28, species: 'Pine', confidence: 0.88 },
  { id: 3, lat: 37.7849, lng: -122.4028, height: 9.1, diameter: 36, species: 'Maple', confidence: 0.94 },
  { id: 4, lat: 37.7847, lng: -122.4025, height: 8.5, diameter: 30, species: 'Oak', confidence: 0.91 },
  { id: 5, lat: 37.7851, lng: -122.4022, height: 7.6, diameter: 26, species: 'Pine', confidence: 0.87 },
];

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
    confidence: 92,
    notes: 'Healthy orchard with good growth. Some trees showing signs of new growth after spring pruning.',
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
    confidence: 88,
    notes: 'Recently planted area showing good initial growth. Some areas need additional irrigation.',
    image: 'https://images.unsplash.com/photo-1559944554-62a2b8f6c8b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
  },
];

const screenWidth = Dimensions.get('window').width;

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [inventoryItem, setInventoryItem] = useState(null);
  const [treeDetails, setTreeDetails] = useState([]);
  
  useEffect(() => {
    // In a real app, this would fetch data from an API or local storage
    const item = mockInventoryData.find(item => item.id === id);
    setInventoryItem(item);
    
    // Set tree details
    setTreeDetails(mockTreeDetails);
  }, [id]);
  
  if (!inventoryItem) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }
  
  // Calculate species distribution for pie chart
  const speciesCount = {};
  inventoryItem.species.forEach(species => {
    speciesCount[species] = (speciesCount[species] || 0) + 1;
  });
  
  const speciesData = Object.keys(speciesCount).map((species, index) => {
    const colors = ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#81C784'];
    return {
      name: species,
      population: speciesCount[species] * 20, // Multiply for better visualization
      color: colors[index % colors.length],
      legendFontColor: '#212121',
      legendFontSize: 12,
    };
  });
  
  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1, index) => {
      const colors = [
        `rgba(46, 125, 50, ${opacity})`,
        `rgba(56, 142, 60, ${opacity})`,
        `rgba(67, 160, 71, ${opacity})`,
        `rgba(76, 175, 80, ${opacity})`,
        `rgba(129, 199, 132, ${opacity})`
      ];
      return colors[index % colors.length];
    },
    labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
  };
  
  // Calculate map region based on tree coordinates
  const initialRegion = {
    latitude: 37.7850,
    longitude: -122.4024,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: inventoryItem.name,
          headerTitleStyle: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 10 }}
            >
              <ArrowLeft size={24} color="#212121" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: inventoryItem.image }} 
          style={styles.headerImage} 
        />
        
        <View style={styles.contentContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Calendar size={16} color="#757575" />
              <Text style={styles.infoText}>{inventoryItem.date}</Text>
            </View>
            <View style={styles.infoItem}>
              <MapPin size={16} color="#757575" />
              <Text style={styles.infoText}>{inventoryItem.location}</Text>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Trees color="#2E7D32" size={24} />
              <Text style={styles.statValue}>{inventoryItem.treeCount}</Text>
              <Text style={styles.statLabel}>Trees</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ruler color="#2E7D32" size={24} />
              <Text style={styles.statValue}>{inventoryItem.area}</Text>
              <Text style={styles.statLabel}>Area</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ruler color="#2E7D32" size={24} />
              <Text style={styles.statValue}>{inventoryItem.avgHeight}</Text>
              <Text style={styles.statLabel}>Avg Height</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ruler color="#2E7D32" size={24} />
              <Text style={styles.statValue}>{inventoryItem.avgDiameter}</Text>
              <Text style={styles.statLabel}>Avg Diameter</Text>
            </View>
          </View>
          
          <View style={styles.confidenceBar}>
            <Text style={styles.confidenceLabel}>ML Confidence</Text>
            <View style={styles.confidenceBarContainer}>
              <View 
                style={[
                  styles.confidenceBarFill, 
                  { 
                    width: `${inventoryItem.confidence}%`,
                    backgroundColor: inventoryItem.confidence > 80 ? '#2E7D32' : 
                                    inventoryItem.confidence > 60 ? '#FFA000' : '#D32F2F'
                  }
                ]} 
              />
            </View>
            <Text style={styles.confidenceValue}>{inventoryItem.confidence}%</Text>
          </View>
          
          {inventoryItem.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{inventoryItem.notes}</Text>
            </View>
          )}
          
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <MapView
              style={styles.map}
              initialRegion={initialRegion}
            >
              {treeDetails.map(tree => (
                <Marker
                  key={tree.id}
                  coordinate={{ latitude: tree.lat, longitude: tree.lng }}
                  title={`${tree.species} Tree`}
                  description={`Height: ${tree.height}m, Diameter: ${tree.diameter}cm`}
                  pinColor="#2E7D32"
                />
              ))}
              
              {treeDetails.length > 2 && (
                <Polygon
                  coordinates={treeDetails.map(tree => ({
                    latitude: tree.lat,
                    longitude: tree.lng
                  }))}
                  fillColor="rgba(46, 125, 50, 0.2)"
                  strokeColor="rgba(46, 125, 50, 0.8)"
                  strokeWidth={2}
                />
              )}
            </MapView>
            <Text style={styles.coordinatesText}>Coordinates: {inventoryItem.coordinates}</Text>
          </View>
          
          <View style={styles.speciesContainer}>
            <Text style={styles.sectionTitle}>Species Distribution</Text>
            <PieChart
              data={speciesData}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
          
          <View style={styles.treeListContainer}>
            <Text style={styles.sectionTitle}>Tree Details</Text>
            {treeDetails.map(tree => (
              <View key={tree.id} style={styles.treeItem}>
                <View style={styles.treeIcon}>
                  <Trees color="#2E7D32" size={20} />
                </View>
                <View style={styles.treeInfo}>
                  <Text style={styles.treeSpecies}>{tree.species}</Text>
                  <Text style={styles.treeDetails}>
                    Height: {tree.height}m | Diameter: {tree.diameter}cm
                  </Text>
                </View>
                <View style={styles.treeConfidence}>
                  <Text style={[
                    styles.confidenceText,
                    { color: tree.confidence > 0.9 ? '#2E7D32' : 
                            tree.confidence > 0.7 ? '#FFA000' : '#D32F2F' }
                  ]}>
                    {(tree.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Download size={20} color="#2E7D32" />
              <Text style={styles.actionButtonText}>Export</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Share2 size={20} color="#2E7D32" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Edit size={20} color="#2E7D32" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
              <Trash2 size={20} color="#D32F2F" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 20,
  },
  headerImage: {
    width: '100%',
    height: 200,
  },
  contentContainer: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212121',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  confidenceBar: {
    marginBottom: 20,
  },
  confidenceLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212121',
    marginBottom: 5,
  },
  confidenceBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
  },
  confidenceValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#212121',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#212121',
    marginBottom: 12,
  },
  notesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
  },
  mapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  coordinatesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  speciesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  treeListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  treeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  treeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  treeSpecies: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#212121',
  },
  treeDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  treeConfidence: {
    width: 50,
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#D32F2F',
  },
});