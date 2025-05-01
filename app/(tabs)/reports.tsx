import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  Download,
  Share2,
  Calendar,
  ChevronDown
} from 'lucide-react-native';
import { LineChart, BarChart, PieChart as PieChartKit } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Mock data for charts
const treeCountData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43],
      color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
      strokeWidth: 2
    }
  ],
  legend: ['Tree Count']
};

const speciesData = {
  labels: ['Oak', 'Pine', 'Maple', 'Birch', 'Elm'],
  data: [0.4, 0.3, 0.15, 0.1, 0.05]
};

const diameterData = {
  labels: ['0-10cm', '10-20cm', '20-30cm', '30-40cm', '40+cm'],
  datasets: [
    {
      data: [10, 25, 35, 20, 10],
    }
  ]
};

export default function ReportsScreen() {
  const [timeRange, setTimeRange] = useState('6 Months');
  const [timeRangeOpen, setTimeRangeOpen] = useState(false);

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

  const pieChartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1, index?: number) => {
      const colors = [
        `rgba(46, 125, 50, ${opacity})`,
        `rgba(56, 142, 60, ${opacity})`,
        `rgba(67, 160, 71, ${opacity})`,
        `rgba(76, 175, 80, ${opacity})`,
        `rgba(129, 199, 132, ${opacity})`
      ];
      return colors[index ? index % colors.length : 0];
    },
    labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
  };

  const barChartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
    barPercentage: 0.7,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
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

          <LineChart
            data={treeCountData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />

          <View style={styles.chartInsight}>
            <Text style={styles.insightText}>
              <Text style={styles.insightHighlight}>+28% growth</Text> in tree inventory over the last {timeRange.toLowerCase()}.
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <PieChart size={20} color="#2E7D32" />
              <Text style={styles.chartTitle}>Species Distribution</Text>
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

          <PieChartKit
            data={speciesData.labels.map((label, index) => ({
              name: label,
              population: speciesData.data[index] * 100,
              color: pieChartConfig.color(1, index),
              legendFontColor: '#212121',
              legendFontSize: 12,
            }))}
            width={screenWidth - 40}
            height={220}
            chartConfig={pieChartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />

          <View style={styles.chartInsight}>
            <Text style={styles.insightText}>
              <Text style={styles.insightHighlight}>Oak (40%)</Text> is the dominant species in your farm inventory.
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

          <BarChart
            data={diameterData}
            width={screenWidth - 40}
            height={220}
            chartConfig={barChartConfig}
            style={styles.chart}
            verticalLabelRotation={0}
            yAxisLabel=""
            yAxisSuffix=""
          />

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
});
