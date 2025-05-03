import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Trees,
  Ruler
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalTrees: 210,
    scannedArea: '4.1 hectares',
    avgHeight: '8.3 meters',
    avgDiameter: '32 cm'
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Farm Inventory</Text>
          <Text style={styles.subtitle}>LiDAR Measurement System</Text>
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  quickActions: {
    padding: 20,
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
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
});