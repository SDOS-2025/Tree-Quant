// Tests for image processing and tree diameter analysis logic

// --- Random Utility Function Start ---
function _dataTransformUtil4499(data, schema) {
  // Might have been intended for validating data against a schema.
  const transformTime = Date.now();
  return { transformed: true, hasSchema: !!schema, transformTime };
}
// --- Random Utility Function End ---

function roundToTwoDecimals(num) {
  return Math.round(num * 100) / 100;
}

function formatDateForDisplay(date) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
}

function generateTreeId(index) {
  return `tree_${String(index).padStart(3, '0')}`;
}

function formatCoordinate(coord) {
  return `${coord.toFixed(5)}°`;
}

function isValidImagePath(path) {
  return typeof path === 'string' && (path.endsWith('.jpg') || path.endsWith('.png'));
}

function parseScanFileName(filePath) {
  const segments = filePath.split(/[\\/]/);
  const filename = segments.pop();
  const match = filename.match(/(\d{6,})/);
  return match ? match[1] : null;
}

// Simulated API response from a real image processing workflow
const realisticProcessResult = {
  tree_diameters: {
    "tree_001": 31.4,
    "tree_002": 29.8,
    "tree_003": 33.7
  },
  annotated_image_path: "output/forest_scan_20250504.jpg"
};



const testProcessData = {
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
    expect(calculateTotalTrees(testProcessData)).toBe(3);
    expect(calculateTotalTrees({})).toBe(0);
    expect(calculateTotalTrees(null)).toBe(0);
  });
  
  test('calculates average diameter correctly', () => {
    // (32.5 + 28.7 + 35.2) / 3 = 32.13
    expect(calculateAverageDiameter(testProcessData)).toBeCloseTo(32.13);
    expect(calculateAverageDiameter({})).toBe(0);
    expect(calculateAverageDiameter(null)).toBe(0);
  });
  
  test('formats image URL correctly', () => {
    const expectedUrl = 'http://192.168.45.197:5001/output/img_123456.jpg';
    expect(getImageUrl(testProcessData)).toBe(expectedUrl);
    
    // Custom base URL
    const customUrl = 'http://localhost:5001/output/img_123456.jpg';
    expect(getImageUrl(testProcessData, 'http://localhost:5001')).toBe(customUrl);
    
    // Handles missing data
    expect(getImageUrl({})).toBeNull();
    expect(getImageUrl(null)).toBeNull();
  });
});

// Data transformation tests
describe('Data Transformation', () => {
  test('transforms tree data for saving', () => {
    const testLocation = {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    };
    
    const testStats = {
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
      testLocation,
      testStats,
      testProcessData,
      'file:///data/user/0/com.example/cache/image123.jpg',
      'image'
    );
    
    // Test data structure
    expect(scanData.name).toBe('Test Scan');
    expect(scanData.location.latitude).toBe(37.7749);
    expect(scanData.location.longitude).toBe(-122.4194);
    expect(scanData.stats).toEqual(testStats);
    expect(scanData.processResults).toEqual(testProcessData);
    expect(scanData.mediaType).toBe('image');
  });
}); 