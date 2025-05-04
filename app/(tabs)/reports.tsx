import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, ActivityIndicator as NativeActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  Download,
  Share2,
  Calendar,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import { LineChart, BarChart, PieChart as PieChartKit } from 'react-native-chart-kit';
import { API_BASE_URL } from '../config'; // Assuming you have this

const screenWidth = Dimensions.get('window').width;

// Define the structure for scan data (align with inventory screen if possible)
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
    total_trees: number; // Use this if stats.treeCount isn't reliable
    tree_diameters: Record<string, number>; // { treeId: diameterInMeters }
    output_url: string;
  };
  // ... other fields if needed
}

// Chart data state initial values
const initialChartData = {
  labels: [],
  datasets: [{ data: [] }],
};

export default function ReportsScreen() {
  const [timeRange, setTimeRange] = useState('All Time');
  const [timeRangeOpen, setTimeRangeOpen] = useState(false);

  // State for fetched data and processed chart data
  const [allScans, setAllScans] = useState<ScanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeCountChartData, setTreeCountChartData] = useState(initialChartData);
  const [diameterChartData, setDiameterChartData] = useState(initialChartData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Data Fetching --- 
  const fetchAllScans = async () => {
    if (!isRefreshing) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/scans`);
      if (!response.ok) {
        throw new Error('Failed to fetch scans for reports');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllScans(data);
      } else if (data && Array.isArray(data.scans)) {
        setAllScans(data.scans);
      } else {
        setAllScans([]);
        throw new Error('Unexpected data format received');
      }
    } catch (err) {
      console.error('Error fetching scans for reports:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAllScans([]); // Clear data on error
    } finally {
      if (!isRefreshing) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllScans();
  }, []); // Initial fetch

  // --- Data Processing --- 
  useEffect(() => {
    if (allScans.length > 0) {
      processTreeCountData(allScans);
      processDiameterData(allScans);
    } else {
      // Reset charts if no data
      setTreeCountChartData(initialChartData);
      setDiameterChartData(initialChartData);
    }
  }, [allScans]); // Re-process when scan data changes

  const processTreeCountData = (scans: ScanData[]) => {
    // Simple processing: Use scan index as label, count as data
    // More complex: group by month/year
    const sortedScans = [...scans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Limit to last N scans for readability or implement timeRange filter
    const displayScans = sortedScans; //.slice(-10); // Example: Show last 10

    const labels = displayScans.map((scan, index) => new Date(scan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const data = displayScans.map(scan => scan.stats?.treeCount || scan.processResults?.total_trees || 0);

    setTreeCountChartData({
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`, // Keep color function
        strokeWidth: 2
      }]
    });
  };

  const processDiameterData = (scans: ScanData[]) => {
    const allDiameters: number[] = [];
    scans.forEach(scan => {
      if (scan.processResults?.tree_diameters) {
        const diameters = Object.values(scan.processResults.tree_diameters);
        allDiameters.push(...diameters);
      }
    });

    // Define diameter buckets (in meters, assuming backend provides meters)
    const buckets = {
      '0-0.1m': 0,
      '0.1-0.2m': 0,
      '0.2-0.3m': 0,
      '0.3-0.4m': 0,
      '0.4m+': 0,
    };
    const bucketKeys = Object.keys(buckets);

    allDiameters.forEach(diameter => {
      if (diameter < 0.1) buckets['0-0.1m']++;
      else if (diameter < 0.2) buckets['0.1-0.2m']++;
      else if (diameter < 0.3) buckets['0.2-0.3m']++;
      else if (diameter < 0.4) buckets['0.3-0.4m']++;
      else buckets['0.4m+']++;
    });

    setDiameterChartData({
      labels: bucketKeys,
      datasets: [{
        data: Object.values(buckets)
      }]
    });
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#2E7D32'
    }
  };

  const barChartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
    barPercentage: 0.7,
  };

  // --- Refresh Handler --- 
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple refreshes
    setIsRefreshing(true);
    await fetchAllScans();
    setIsRefreshing(false);
  };

  // --- Render Logic --- 
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading Reports...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <AlertTriangle size={40} color="#D32F2F" />
        <Text style={styles.errorText}>Error loading reports: {error}</Text>
        {/* Optional: Add a retry button here */}
      </SafeAreaView>
    );
  }

  if (allScans.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>No scan data available to generate reports.</Text>
      </SafeAreaView>
    );
  }

  // --- Main Render --- 
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Reports</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <NativeActivityIndicator size="small" color="#2E7D32" />
            ) : (
              <RefreshCw size={24} color="#2E7D32" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Analytics & Insights</Text>
      </View>

      <View style={styles.timeRangeContainer}>
        <Text style={styles.timeRangeLabel}>Time Range:</Text>
        <TouchableOpacity
          style={styles.timeRangeSelector}
          onPress={() => setTimeRangeOpen(!timeRangeOpen)}
        >
          <Calendar size={16} color="#757575" />
          <Text style={styles.timeRangeText}>{timeRange}</Text>
          <ChevronDown size={16} color="#757575" />
        </TouchableOpacity>

        {timeRangeOpen && (
          <View style={styles.timeRangeDropdown}>
            {['1 Month', '3 Months', '6 Months', '1 Year', 'All Time'].map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.timeRangeOption, timeRange === range && styles.selectedTimeRange]}
                onPress={() => {
                  setTimeRange(range);
                  setTimeRangeOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.timeRangeOptionText,
                    timeRange === range && styles.selectedTimeRangeText
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <LineChartIcon size={20} color="#2E7D32" />
              <Text style={styles.chartTitle}>Tree Count Over Time</Text>
            </View>
            <View style={styles.chartActions}>
              <TouchableOpacity style={styles.chartAction}>
                <Download size={16} color="#757575" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chartAction}>
                <Share2 size={16} color="#757575" />
              </TouchableOpacity>
            </View>
          </View>

          {treeCountChartData.labels.length > 0 ? (
            <LineChart
              data={treeCountChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noDataText}>No data for Tree Count chart.</Text>
          )}

          <View style={styles.chartInsight}>
            <Text style={styles.insightText}>
              <Text style={styles.insightHighlight}>+28% growth</Text> in tree inventory over the last {timeRange.toLowerCase()}.
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <BarChart3 size={20} color="#2E7D32" />
              <Text style={styles.chartTitle}>Tree Diameter Distribution</Text>
            </View>
            <View style={styles.chartActions}>
              <TouchableOpacity style={styles.chartAction}>
                <Download size={16} color="#757575" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chartAction}>
                <Share2 size={16} color="#757575" />
              </TouchableOpacity>
            </View>
          </View>

          {diameterChartData.labels.length > 0 ? (
            <BarChart
              data={diameterChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={barChartConfig}
              style={styles.chart}
              verticalLabelRotation={0}
              yAxisLabel=""
              yAxisSuffix=" trees"
              fromZero={true}
            />
          ) : (
            <Text style={styles.noDataText}>No data for Diameter chart.</Text>
          )}

          <View style={styles.chartInsight}>
            <Text style={styles.insightText}>
              The most common diameter range is <Text style={styles.insightHighlight}>20-30cm (35 trees)</Text>.
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Key Insights</Text>

          <View style={styles.summaryItem}>
            <View style={styles.summaryBullet} />
            <Text style={styles.summaryText}>
              Your farm has a healthy diversity of tree species with Oak being the most common.
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={styles.summaryBullet} />
            <Text style={styles.summaryText}>
              Tree inventory has grown by 28% in the last 6 months, indicating successful planting initiatives.
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={styles.summaryBullet} />
            <Text style={styles.summaryText}>
              The diameter distribution shows a healthy growth pattern with most trees in the 20-30cm range.
            </Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#212121',
  },
  refreshButton: {
    padding: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    zIndex: 10,
  },
  timeRangeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212121',
    marginRight: 10,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeRangeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#212121',
    marginHorizontal: 8,
  },
  timeRangeDropdown: {
    position: 'absolute',
    top: 40,
    left: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    width: 150,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
  },
  timeRangeOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  selectedTimeRange: {
    backgroundColor: '#E8F5E9',
  },
  timeRangeOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#212121',
  },
  selectedTimeRangeText: {
    fontFamily: 'Inter-Medium',
    color: '#2E7D32',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chartCard: {
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#212121',
    marginLeft: 8,
  },
  chartActions: {
    flexDirection: 'row',
  },
  chartAction: {
    marginLeft: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  chartInsight: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  insightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#212121',
  },
  insightHighlight: {
    fontFamily: 'Inter-SemiBold',
    color: '#2E7D32',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#212121',
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  summaryBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    marginTop: 6,
    marginRight: 10,
  },
  summaryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#212121',
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#757575',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    paddingVertical: 50,
  }
});
