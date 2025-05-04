import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowRight,
  Trees,
  Ruler,
  CloudOff,
  AlertCircle,
  RefreshCw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '../config';

const SCANS_FILE = `${FileSystem.documentDirectory}scans.json`;

interface ScanData {
  id: string;
  name: string;
  date: string;
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
}

export default function HomeScreen() {
  const router = useRouter();
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTrees: 0,
    scannedArea: '0 hectares',
    avgHeight: '0 meters',
    avgDiameter: '0 cm'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/api/scans`);
      const data = await response.json();
      
      const processedScans = data.map((scan: ScanData) => ({
        id: scan.id,
        name: scan.name,
        date: new Date(scan.date).toLocaleDateString(),
        treeCount: scan.processResults.total_trees,
        area: scan.stats.area,
        image: scan.processResults.output_url
      }));

      setRecentScans(processedScans.slice(0, 5));
      
      const totalTrees = processedScans.reduce((acc: number, scan: any) => acc + scan.treeCount, 0);
      const latestScanArea = processedScans.length > 0 
        ? processedScans[0]?.stats?.area || '0 hectares' 
        : '0 hectares';

      setStats(prev => ({
        ...prev,
        totalTrees,
        scannedArea: latestScanArea,
        avgHeight: processedScans.length > 0 
          ? processedScans[0]?.stats?.avgHeight || '0 meters' 
          : '0 meters',
        avgDiameter: processedScans.length > 0 
          ? processedScans[0]?.stats?.avgDiameter || '0 cm' 
          : '0 cm'
      }));
      
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Farm Inventory</Text>
            <Text style={styles.subtitle}>LiDAR Measurement System</Text>
          </View>
          <TouchableOpacity onPress={fetchData} disabled={isRefreshing}>
            {isRefreshing ? (
              <ActivityIndicator color="#2E7D32" />
            ) : (
              <RefreshCw color="#2E7D32" size={24} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push('/scan')}
          >
            <LinearGradient
              colors={['#2E7D32', '#1B5E20']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.scanButtonText}>Start New Scan</Text>
              <ArrowRight color="#FFFFFF" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Farm Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Trees color="#2E7D32" size={24} />
              <Text style={styles.statValue}>{stats.totalTrees}</Text>
              <Text style={styles.statLabel}>Total Trees</Text>
            </View>
            <View style={styles.statCard}>
              <Ruler color="#2E7D32" size={24} />
              <Text style={styles.statValue}>{stats.scannedArea}</Text>
              <Text style={styles.statLabel}>Area Scanned</Text>
            </View>
            <View style={styles.statCard}>
              <Ruler color="#2E7D32" size={24} />
              <Text style={styles.statValue}>{stats.avgHeight}</Text>
              <Text style={styles.statLabel}>Avg. Height</Text>
            </View>
            <View style={styles.statCard}>
              <Ruler color="#2E7D32" size={24} />
              <Text style={styles.statValue}>{stats.avgDiameter}</Text>
              <Text style={styles.statLabel}>Avg. Diameter</Text>
            </View>
          </View>
        </View>

        <View style={styles.recentScans}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push('/inventory')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentScans.map(scan => (
            <TouchableOpacity
              key={scan.id}
              style={styles.scanCard}
              onPress={() => router.push(`/inventory/${scan.id}`)}
            >
              <Image
                source={{ uri: scan.image }}
                style={styles.scanImage}
              />
              <View style={styles.scanInfo}>
                <Text style={styles.scanName}>{scan.name}</Text>
                <Text style={styles.scanDate}>{scan.date}</Text>
                <View style={styles.scanStats}>
                  <Text style={styles.scanStat}>
                    <Trees color="#2E7D32" size={14} /> {scan.treeCount} trees
                  </Text>
                  <Text style={styles.scanStat}>
                    <Ruler color="#2E7D32" size={14} /> {scan.area}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {Platform.OS !== 'web' && (
          <View style={styles.offlineWarning}>
            <CloudOff color="#F57C00" size={20} />
            <Text style={styles.offlineText}>Offline mode available</Text>
          </View>
        )}

        <View style={styles.disclaimer}>
          <AlertCircle color="#757575" size={16} />
          <Text style={styles.disclaimerText}>
            LiDAR scanning requires compatible hardware. Measurement accuracy may vary based on environmental conditions.
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#212121',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  scanButton: {
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
    paddingHorizontal: 20,
  },
  scanButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  statsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#212121',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    fontSize: 20,
    color: '#212121',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  recentScans: {
    marginTop: 15,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2E7D32',
  },
  scanCard: {
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
  scanImage: {
    width: '100%',
    height: 120,
  },
  scanInfo: {
    padding: 16,
  },
  scanName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#212121',
  },
  scanDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  scanStats: {
    flexDirection: 'row',
    marginTop: 8,
  },
  scanStat: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#424242',
    marginRight: 16,
    alignItems: 'center',
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  offlineText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#F57C00',
    marginLeft: 8,
  },
  disclaimer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#757575',
    marginLeft: 8,
    flex: 1,
  },
});