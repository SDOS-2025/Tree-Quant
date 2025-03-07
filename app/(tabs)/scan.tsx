import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Play, 
  Pause, 
  Save, 
  Trash2, 
  MapPin, 
  Trees, 
  Ruler, 
  AlertTriangle,
  Info
} from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

// Mock data for LiDAR scanning simulation
const mockTreeData = [
  { id: 1, lat: 37.7850, lng: -122.4024, height: 8.2, diameter: 34, species: 'Oak', confidence: 0.92 },
  { id: 2, lat: 37.7852, lng: -122.4026, height: 7.8, diameter: 28, species: 'Pine', confidence: 0.88 },
  { id: 3, lat: 37.7849, lng: -122.4028, height: 9.1, diameter: 36, species: 'Maple', confidence: 0.94 },
  { id: 4, lat: 37.7847, lng: -122.4025, height: 8.5, diameter: 30, species: 'Oak', confidence: 0.91 },
  { id: 5, lat: 37.7851, lng: -122.4022, height: 7.6, diameter: 26, species: 'Pine', confidence: 0.87 },
];

export default function ScanScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [scannedTrees, setScannedTrees] = useState([]);
  const [scanStats, setScanStats] = useState({
    treeCount: 0,
    avgHeight: 0,
    avgDiameter: 0,
    area: 0,
    confidence: 0
  });
  const [scanName, setScanName] = useState('New Scan');
  const [scanRegion, setScanRegion] = useState({
    latitude: 37.7850,
    longitude: -122.4024,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setErrorMsg('Location services are limited on web platform');
        return;
      }
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setScanRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // Simulate LiDAR scanning process
  useEffect(() => {
    if (scanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            setScanning(false);
            completeScan();
            return 100;
          }
          return newProgress;
        });
        
        // Gradually reveal trees as scanning progresses
        const treesToShow = Math.floor((scanProgress / 100) * mockTreeData.length);
        setScannedTrees(mockTreeData.slice(0, treesToShow));
        
        // Update stats based on scanned trees
        if (scannedTrees.length > 0) {
          const heights = scannedTrees.map(tree => tree.height);
          const diameters = scannedTrees.map(tree => tree.diameter);
          const confidences = scannedTrees.map(tree => tree.confidence);
          
          setScanStats({
            treeCount: scannedTrees.length,
            avgHeight: (heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(1),
            avgDiameter: (diameters.reduce((a, b) => a + b, 0) / diameters.length).toFixed(1),
            area: (scannedTrees.length * 0.01).toFixed(2),
            confidence: (confidences.reduce((a, b) => a + b, 0) / confidences.length * 100).toFixed(0)
          });
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [scanning, scanProgress, scannedTrees]);

  const startScan = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Platform Limitation',
        'LiDAR scanning requires native device capabilities not available on web.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setScanning(true);
    setScanProgress(0);
    setScannedTrees([]);
    setScanStats({
      treeCount: 0,
      avgHeight: 0,
      avgDiameter: 0,
      area: 0,
      confidence: 0
    });
  };

  const pauseScan = () => {
    setScanning(false);
  };

  const completeScan = () => {
    // In a real app, this would process the LiDAR data and apply ML algorithms
    console.log('Scan completed');
  };

  const saveScan = () => {
    // In a real app, this would save the scan data to storage
    Alert.alert(
      'Scan Saved',
      `${scanName} has been saved to your inventory with ${scanStats.treeCount} trees.`,
      [{ text: 'OK', onPress: () => router.push('/inventory') }]
    );
  };

  const cancelScan = () => {
    Alert.alert(
      'Cancel Scan',
      'Are you sure you want to discard this scan?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => {
            setScanning(false);
            setScanProgress(0);
            setScannedTrees([]);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LiDAR Scanner</Text>
        {errorMsg && (
          <View style={styles.errorBanner}>
            <AlertTriangle color="#D32F2F" size={16} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={scanRegion}
          showsUserLocation={true}
        >
          {scannedTrees.map(tree => (
            <Marker
              key={tree.id}
              coordinate={{ latitude: tree.lat, longitude: tree.lng }}
              title={`${tree.species} Tree`}
              description={`Height: ${tree.height}m, Diameter: ${tree.diameter}cm`}
              pinColor="#2E7D32"
            />
          ))}
          
          {scannedTrees.length > 2 && (
            <Polygon
              coordinates={scannedTrees.map(tree => ({
                latitude: tree.lat,
                longitude: tree.lng
              }))}
              fillColor="rgba(46, 125, 50, 0.2)"
              strokeColor="rgba(46, 125, 50, 0.8)"
              strokeWidth={2}
            />
          )}
        </MapView>
        
        {scanning && (
          <View style={styles.scanOverlay}>
            <Text style={styles.scanningText}>Scanning in progress...</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${scanProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{scanProgress}%</Text>
          </View>
        )}
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        <View style={styles.scanControls}>
          {!scanning ? (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={startScan}
            >
              <LinearGradient
                colors={['#2E7D32', '#1B5E20']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Play color="#FFFFFF" size={20} />
                <Text style={styles.buttonText}>Start Scan</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.pauseButton}
              onPress={pauseScan}
            >
              <Pause color="#FFFFFF" size={20} />
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.secondaryControls}>
            <TouchableOpacity 
              style={[styles.secondaryButton, { opacity: scanProgress > 0 ? 1 : 0.5 }]}
              onPress={saveScan}
              disabled={scanProgress === 0}
            >
              <Save color="#2E7D32" size={20} />
              <Text style={styles.secondaryButtonText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, { opacity: scanProgress > 0 ? 1 : 0.5 }]}
              onPress={cancelScan}
              disabled={scanProgress === 0}
            >
              <Trash2 color="#D32F2F" size={20} />
              <Text style={[styles.secondaryButtonText, { color: '#D32F2F' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {scanProgress > 0 && (
          <>
            <View style={styles.scanInfoCard}>
              <Text style={styles.scanInfoTitle}>Scan Results</Text>
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Trees color="#2E7D32" size={20} />
                  <Text style={styles.infoLabel}>Trees Detected</Text>
                  <Text style={styles.infoValue}>{scanStats.treeCount}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Ruler color="#2E7D32" size={20} />
                  <Text style={styles.infoLabel}>Area Covered</Text>
                  <Text style={styles.infoValue}>{scanStats.area} ha</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ruler color="#2E7D32" size={20} />
                  <Text style={styles.infoLabel}>Avg. Height</Text>
                  <Text style={styles.infoValue}>{scanStats.avgHeight} m</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Ruler color="#2E7D32" size={20} />
                  <Text style={styles.infoLabel}>Avg. Diameter</Text>
                  <Text style={styles.infoValue}>{scanStats.avgDiameter} cm</Text>
                </View>
              </View>
              
              <View style={styles.confidenceBar}>
                <Text style={styles.confidenceLabel}>ML Confidence</Text>
                <View style={styles.confidenceBarContainer}>
                  <View 
                    style={[
                      styles.confidenceBarFill, 
                      { 
                        width: `${scanStats.confidence}%`,
                        backgroundColor: parseInt(scanStats.confidence) > 80 ? '#2E7D32' : 
                                        parseInt(scanStats.confidence) > 60 ? '#FFA000' : '#D32F2F'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.confidenceValue}>{scanStats.confidence}%</Text>
              </View>
            </View>
            
            {scannedTrees.length > 0 && (
              <View style={styles.treeListContainer}>
                <Text style={styles.sectionTitle}>Detected Trees</Text>
                {scannedTrees.map(tree => (
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
            )}
          </>
        )}
        
        <View style={styles.infoBox}>
          <Info color="#1976D2" size={16} />
          <Text style={styles.infoBoxText}>
            LiDAR scanning uses light detection and ranging technology to create precise 3D models of trees. 
            Machine learning algorithms analyze the data to identify species and measure dimensions.
          </Text>
        </View>
      </ScrollView>
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#D32F2F',
    marginLeft: 8,
  },
  mapContainer: {
    height: 300,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  scanOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    alignItems: 'center',
  },
  scanningText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2E7D32',
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scanControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  startButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFA000',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryControls: {
    flexDirection: 'column',
    marginLeft: 15,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  secondaryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
  },
  scanInfoCard: {
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
  scanInfoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#212121',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoItem: {
    alignItems: 'center',
    width: '48%',
  },
  infoLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    marginTop: 5,
  },
  infoValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#212121',
    marginTop: 5,
  },
  confidenceBar: {
    marginTop: 10,
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
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#212121',
    marginBottom: 15,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  infoBoxText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
});