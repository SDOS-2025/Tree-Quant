import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Image, ActivityIndicator } from 'react-native';
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
  Info,
  Camera,
  Upload
} from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Define tree data type
interface TreeData {
  id: number;
  lat: number;
  lng: number;
  diameter: number;
  species: string;
}

// Define scan stats type
interface ScanStats {
  treeCount: number;
  avgDiameter: string;
  area: string;
}

// Mock data for LiDAR scanning simulation
const mockTreeData: TreeData[] = [
  { id: 1, lat: 37.7850, lng: -122.4024, diameter: 34, species: 'Oak' },
  { id: 2, lat: 37.7852, lng: -122.4026, diameter: 28, species: 'Pine' },
  { id: 3, lat: 37.7849, lng: -122.4028, diameter: 36, species: 'Maple' },
  { id: 4, lat: 37.7847, lng: -122.4025, diameter: 30, species: 'Oak' },
  { id: 5, lat: 37.7851, lng: -122.4022, diameter: 26, species: 'Pine' },
];

const API_BASE_URL = Platform.select({
  ios: 'http://192.168.46.104:5001',
  android: 'http://192.168.46.104:5001',
  default: 'http://localhost:5001',
});


export default function ScanScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannedTrees, setScannedTrees] = useState<TreeData[]>([]);
  const [scanStats, setScanStats] = useState<ScanStats>({
    treeCount: 0,
    avgDiameter: '0',
    area: '0'
  });
  const [scanName, setScanName] = useState('New Scan');
  const [scanRegion, setScanRegion] = useState({
    latitude: 37.7850,
    longitude: -122.4024,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processResults, setProcessResults] = useState<any>(null);

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
          const diameters = scannedTrees.map(tree => tree.diameter);

          setScanStats({
            treeCount: scannedTrees.length,
            avgDiameter: (diameters.reduce((a, b) => a + b, 0) / diameters.length).toFixed(1),
            area: (scannedTrees.length * 0.01).toFixed(2)
          });
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [scanning, scanProgress, scannedTrees]);

  const startScan = () => {
    if (Platform.OS === 'web') {
      // Use window.alert for web platform
      window.alert('LiDAR scanning requires native device capabilities not available on web.');
      return;
    }

    setScanning(true);
    setScanProgress(0);
    setScannedTrees([]);
    setScanStats({
      treeCount: 0,
      avgDiameter: '0',
      area: '0'
    });
  };

  const pauseScan = () => {
    setScanning(false);
  };

  const completeScan = () => {
    // In a real app, this would process the LiDAR data and apply ML algorithms
    console.log('Scan completed');
  };

  const saveScan = async () => {
    if (!processResults) {
      Alert.alert('No Results', 'Please process an image first before saving.');
      return;
    }

    try {
      const scanData = {
        id: Date.now().toString(),
        name: scanName,
        date: new Date().toISOString(),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : null,
        stats: scanStats,
        processResults: processResults,
        mediaUri: selectedMedia,
        mediaType: mediaType,
      };

      // Send scan data to backend
      const response = await fetch(`${API_BASE_URL}/api/scans/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanData),
      });

      if (!response.ok) {
        throw new Error('Failed to save scan');
      }

      Alert.alert(
        'Scan Saved',
        `${scanName} has been saved to your inventory with ${scanStats.treeCount} trees.`,
        [{ text: 'OK', onPress: () => router.push('/inventory') }]
      );
    } catch (error) {
      console.error('Error saving scan:', error);
      Alert.alert('Error', 'Failed to save scan to inventory.');
    }
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
            setProcessResults(null);
            setSelectedMedia(null);
            setMediaType(null);
            setScanStats({
              treeCount: 0,
              avgDiameter: '0',
              area: '0'
            });
          }
        }
      ]
    );
  };

  // Media picker and upload functions
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedMedia(uri);
      setMediaType(uri.endsWith('.mp4') || uri.includes('video') ? 'video' : 'image');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedMedia(uri);
      setMediaType(uri.endsWith('.mp4') || uri.includes('video') ? 'video' : 'image');
    }
  };

  const uploadAndProcess = async () => {
    if (!selectedMedia) {
      Alert.alert('No media selected', 'Please select an image or video first.');
      return;
    }

    setProcessing(true);

    try {
      const fileUri = selectedMedia;
      const fileNameParts = fileUri.split('/');
      const fileName = fileNameParts[fileNameParts.length - 1];
      let result;

      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append('image', blob, fileName);

        const uploadResponse = await fetch(`${API_BASE_URL}/api/tree-detection/process-image`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        result = await uploadResponse.json();
      } else {
        const uploadResponse = await FileSystem.uploadAsync(
          `${API_BASE_URL}/api/tree-detection/process-image`,
          fileUri,
          {
            fieldName: 'image',
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            mimeType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
          }
        );

        if (uploadResponse.status !== 200) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        result = JSON.parse(uploadResponse.body);
      }

      if (result) {
        // Convert the local file path to a proper URL
        if (result.annotated_image_path) {
          // Extract the filename from the path
          const fileName = result.annotated_image_path.split('\\').pop();
          // Create a URL to access the image through the backend
          result.output_url = `${API_BASE_URL}/output/${fileName}`;
          console.log('Processed Image URL:', result.output_url);
        }
        
        setProcessResults(result);
        
        if (result.tree_diameters) {
          const treeCount = Object.keys(result.tree_diameters).length;
          if (treeCount > 0) {
            const diameters = Object.values(result.tree_diameters) as number[];
            const avgDiameter = (diameters.reduce((a: number, b: number) => a + b, 0) / diameters.length).toFixed(1);

            setScanStats({
              treeCount,
              avgDiameter,
              area: (treeCount * 0.01).toFixed(2)
            });
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const renderMediaPreview = () => {
    if (!selectedMedia) return null;

    return (
      <View style={styles.mediaPreviewContainer}>
        {mediaType === 'video' ? (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>Video Selected</Text>
            <Text style={styles.videoFilename}>{selectedMedia.split('/').pop()}</Text>
          </View>
        ) : (
          <Image source={{ uri: selectedMedia }} style={styles.mediaPreview} />
        )}

        <TouchableOpacity
          style={styles.processButton}
          onPress={uploadAndProcess}
          disabled={processing}
        >
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Upload color="#FFFFFF" size={20} />
                <Text style={styles.buttonText}>Process with ML</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProcessResults = () => {
    if (!processResults) return null;

    console.log('Process Results:', processResults);
    console.log('Image URL:', processResults.output_url);

    return (
      <View style={styles.resultsCard}>
        <Text style={styles.resultsTitle}>ML Processing Results</Text>

        {processResults.output_url ? (
          <View style={styles.resultImageContainer}>
            <View style={styles.annotatedImageContainer}>
              <Image
                source={{ uri: processResults.output_url }}
                style={styles.annotatedImage}
                resizeMode="contain"
                onError={(e) => {
                  console.error('Image loading error:', e.nativeEvent.error);
                  console.error('Failed URL:', processResults.output_url);
                }}
                onLoad={() => console.log('Image loaded successfully')}
              />
              {processResults.tree_diameters && Object.keys(processResults.tree_diameters).length > 0 && (
                <View style={styles.diameterOverlay}>
                  {Object.entries(processResults.tree_diameters).map(([treeId, diameter]: [string, any]) => (
                    <View key={treeId} style={styles.diameterLabel}>
                      <Text style={styles.diameterLabelText}>
                        {parseFloat(diameter).toFixed(2)}m
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>No processed image available</Text>
            <Text style={styles.debugText}>Debug Info: {JSON.stringify(processResults, null, 2)}</Text>
          </View>
        )}

        <View style={styles.diameterList}>
          <Text style={styles.diameterTitle}>Detected Tree Diameters (Estimated)</Text>
          {processResults.tree_diameters && Object.keys(processResults.tree_diameters).length > 0 ? (
            Object.entries(processResults.tree_diameters).map(([treeId, diameter]: [string, any]) => (
              <Text key={treeId} style={styles.diameterItem}>
                Tree ID {treeId}: {parseFloat(diameter).toFixed(2)} meters
              </Text>
            ))
          ) : (
            <Text style={styles.noDiameters}>No trees detected or diameters calculated.</Text>
          )}
          <Text style={styles.diameterNote}>
            Note: Diameter estimation depends heavily on accurate depth perception and camera calibration.
            These values are approximate.
          </Text>
        </View>
      </View>
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
              description={`Diameter: ${tree.diameter}cm`}
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
        <View style={styles.mediaButtonsContainer}>
          <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
            <Camera color="#2E7D32" size={24} />
            <Text style={styles.mediaButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
            <Upload color="#2E7D32" size={24} />
            <Text style={styles.mediaButtonText}>Upload Media</Text>
          </TouchableOpacity>
        </View>

        {renderMediaPreview()}

        {renderProcessResults()}

        <View style={styles.scanControls}>
          <View style={styles.secondaryControls}>
            <TouchableOpacity
              style={[styles.secondaryButton, { opacity: processResults ? 1 : 0.5 }]}
              onPress={saveScan}
              disabled={!processResults}
            >
              <Save color="#2E7D32" size={20} />
              <Text style={styles.secondaryButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { opacity: processResults ? 1 : 0.5 }]}
              onPress={cancelScan}
              disabled={!processResults}
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
                  <Text style={styles.infoLabel}>Avg. Diameter</Text>
                  <Text style={styles.infoValue}>{scanStats.avgDiameter} cm</Text>
                </View>
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
                        Diameter: {tree.diameter}cm
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
  mediaButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  mediaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    width: '45%',
  },
  mediaButtonText: {
    fontFamily: 'Inter-Medium',
    color: '#2E7D32',
    marginTop: 8,
    fontSize: 14,
  },
  mediaPreviewContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  mediaPreview: {
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    width: '100%',
  },
  videoPlaceholder: {
    height: 120,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#424242',
  },
  videoFilename: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#616161',
    marginTop: 4,
  },
  processButton: {
    marginTop: 16,
  },
  resultsCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  resultsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#212121',
    marginBottom: 12,
  },
  resultImageContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  annotatedImageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  annotatedImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  videoResult: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#424242',
    padding: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    width: '100%',
    textAlign: 'center',
  },
  diameterList: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  diameterTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#212121',
    marginBottom: 8,
  },
  diameterItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#424242',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  noDiameters: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
    padding: 8,
  },
  diameterNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 8,
    fontStyle: 'italic',
  },
  diameterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  diameterLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(46, 125, 50, 0.8)',
    padding: 4,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  diameterLabelText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  noImageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    padding: 20,
  },
  noImageContainer: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginVertical: 10,
  },
  debugText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#757575',
    marginTop: 10,
  },
});
