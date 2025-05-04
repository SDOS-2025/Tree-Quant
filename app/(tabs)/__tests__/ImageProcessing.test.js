// Tests for image processing and tree diameter analysis logic

// Mock response data from image processing endpoint
const mockProcessResult = {
  tree_diameters: {
    "1": 32.5,
    "2": 28.7,
    "3": 35.2
  },
  annotated_image_path: "output/img_123456.jpg"
};

// Pure functional logic (extracted from your components)
function calculateTotalTrees(processResult) {
  if (!processResult || !processResult.tree_diameters) return 0;
  return Object.keys(processResult.tree_diameters).length;
}

function calculateAverageDiameter(processResult) {
  if (!processResult || !processResult.tree_diameters) return 0;
  
  const diameters = Object.values(processResult.tree_diameters);
  if (diameters.length === 0) return 0;
  
  const sum = diameters.reduce((total, diameter) => total + diameter, 0);
  return sum / diameters.length;
}

function getImageUrl(processResult, baseUrl = 'http://192.168.45.197:5001') {
  if (!processResult || !processResult.annotated_image_path) return null;
  
  const filePath = processResult.annotated_image_path;
  // Check if the path already contains 'output/' to avoid duplication
  if (filePath.startsWith('output/')) {
    return `${baseUrl}/${filePath}`;
  } else {
    const fileName = filePath.split('\\').pop();
    return `${baseUrl}/output/${fileName}`;
  }
}

// Tests for image processing functions
describe('Image Processing Logic', () => {
  test('correctly counts detected trees', () => {
    expect(calculateTotalTrees(mockProcessResult)).toBe(3);
    expect(calculateTotalTrees({})).toBe(0);
    expect(calculateTotalTrees(null)).toBe(0);
  });
  
  test('calculates average diameter correctly', () => {
    // (32.5 + 28.7 + 35.2) / 3 = 32.13
    expect(calculateAverageDiameter(mockProcessResult)).toBeCloseTo(32.13);
    expect(calculateAverageDiameter({})).toBe(0);
    expect(calculateAverageDiameter(null)).toBe(0);
  });
  
  test('formats image URL correctly', () => {
    const expectedUrl = 'http://192.168.45.197:5001/output/img_123456.jpg';
    expect(getImageUrl(mockProcessResult)).toBe(expectedUrl);
    
    // Custom base URL
    const customUrl = 'http://localhost:5001/output/img_123456.jpg';
    expect(getImageUrl(mockProcessResult, 'http://localhost:5001')).toBe(customUrl);
    
    // Handles missing data
    expect(getImageUrl({})).toBeNull();
    expect(getImageUrl(null)).toBeNull();
  });
});

// Data transformation tests
describe('Data Transformation', () => {
  test('transforms tree data for saving', () => {
    const mockLocation = {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    };
    
    const mockStats = {
      treeCount: 3,
      avgDiameter: '32.1',
      area: '0.03'
    };
    
    // Function to prepare scan data for saving
    function prepareScanData(name, location, stats, processResults, mediaUri, mediaType) {
      return {
        id: Date.now(), // This would normally be dynamic
        name: name,
        date: new Date().toISOString(),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : null,
        stats: stats,
        processResults: processResults,
        mediaUri: mediaUri,
        mediaType: mediaType,
      };
    }
    
    // Create mock data
    const scanData = prepareScanData(
      'Test Scan',
      mockLocation,
      mockStats,
      mockProcessResult,
      'file:///data/user/0/com.example/cache/image123.jpg',
      'image'
    );
    
    // Test data structure
    expect(scanData.name).toBe('Test Scan');
    expect(scanData.location.latitude).toBe(37.7749);
    expect(scanData.location.longitude).toBe(-122.4194);
    expect(scanData.stats).toEqual(mockStats);
    expect(scanData.processResults).toEqual(mockProcessResult);
    expect(scanData.mediaType).toBe('image');
  });
}); 