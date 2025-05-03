import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trees,
  Ruler,
  Download
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Use environment variable or fallback to localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

interface ScanDetail {
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

export default function ScanDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching scan from:', `${API_BASE_URL}/api/scans/${id}`);
        const response = await fetch(`${API_BASE_URL}/api/scans/${id}`);
        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          throw new Error(`Failed to fetch scan details: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received scan data:', data);
        setScan(data);
      } catch (error) {
        console.error('Error fetching scan:', error);
        setError(`Failed to load scan details: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScan();
  }, [id]);

  const exportData = async (format: string) => {
    if (!scan) return;

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
        const location = scan.location 
          ? `${scan.location.latitude}, ${scan.location.longitude}`
          : 'N/A';
        content += `${scan.id},"${scan.name}",${scan.date},"${location}",${scan.stats.treeCount},"${scan.stats.area}","${scan.stats.avgDiameter}"\n`;
        filename = `scan_${scan.id}_${timestamp}.csv`;
      } else {
        content = JSON.stringify(scan, null, 2);
        filename = `scan_${scan.id}_${timestamp}.json`;
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading scan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !scan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Scan not found'}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.title}>{scan.name}</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => exportData('csv')}
          >
            <Download size={20} color="#2E7D32" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => exportData('json')}
          >
            <Download size={20} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Image
          source={{ uri: scan.processResults.output_url }}
          style={styles.image}
        />

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Calendar size={20} color="#757575" />
              <Text style={styles.infoText}>
                {new Date(scan.date).toLocaleDateString()}
              </Text>
            </View>
            {scan.location && (
              <View style={styles.infoItem}>
                <MapPin size={20} color="#757575" />
                <Text style={styles.infoText}>
                  {scan.location.latitude.toFixed(4)}, {scan.location.longitude.toFixed(4)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Trees size={24} color="#2E7D32" />
              <Text style={styles.statValue}>{scan.stats.treeCount}</Text>
              <Text style={styles.statLabel}>Total Trees</Text>
            </View>

            <View style={styles.statItem}>
              <Ruler size={24} color="#2E7D32" />
              <Text style={styles.statValue}>{scan.stats.area}</Text>
              <Text style={styles.statLabel}>Area</Text>
            </View>

            <View style={styles.statItem}>
              <Ruler size={24} color="#2E7D32" />
              <Text style={styles.statValue}>{scan.stats.avgDiameter}</Text>
              <Text style={styles.statLabel}>Avg Diameter</Text>
            </View>
          </View>

          <View style={styles.diameterDistribution}>
            <Text style={styles.sectionTitle}>Tree Diameter Distribution</Text>
            {Object.entries(scan.processResults.tree_diameters).map(([diameter, count]) => (
              <View key={diameter} style={styles.diameterItem}>
                <Text style={styles.diameterText}>{diameter} cm</Text>
                <Text style={styles.diameterCount}>{count} trees</Text>
              </View>
            ))}
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    textAlign: 'center',
  },
  exportButtons: {
    flexDirection: 'row',
  },
  exportButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#EEEEEE',
  },
  infoSection: {
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
    fontSize: 16,
    color: '#757575',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  diameterDistribution: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  diameterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  diameterText: {
    fontSize: 16,
    color: '#212121',
  },
  diameterCount: {
    fontSize: 16,
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
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E7D32',
  },
}); 