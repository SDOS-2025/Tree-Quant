const saveScan = async (processedData) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(SCANS_FILE);
    let existingScans = [];
    
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(SCANS_FILE);
      existingScans = JSON.parse(content);
    }

    const newScan = {
      id: Date.now().toString(),
      name: `Scan ${existingScans.length + 1}`,
      date: new Date().toISOString(),
      stats: {
        treeCount: processedData.total_trees,
        avgDiameter: processedData.avg_diameter,
        area: processedData.area
      },
      processResults: processedData
    };

    const updatedScans = [...existingScans, newScan];
    await FileSystem.writeAsStringAsync(SCANS_FILE, JSON.stringify(updatedScans));
    
    // Force refresh home screen
    router.replace('/(tabs)/');
    router.push('/(tabs)/inventory');

  } catch (error) {
    console.error('Error saving scan:', error);
  }
}; 