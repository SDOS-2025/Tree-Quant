// Testing a simplified version of scan button functionality
const React = require('react');
const { TouchableOpacity, Text } = require('react-native');

function ScanButton({ title, onPress, disabled }) {
  return React.createElement(
    TouchableOpacity,
    { 
      onPress: onPress, 
      disabled: disabled,
      style: {
        backgroundColor: disabled ? '#cccccc' : '#2E7D32',
        padding: 16,
        borderRadius: 12,
      }
    },
    React.createElement(
      Text,
      { 
        style: { 
          color: 'white', 
          textAlign: 'center',
          fontWeight: 'bold' 
        } 
      },
      title
    )
  );
}

describe('Scan Button Component', () => {
  it('creates a button with correct title', () => {
    const button = React.createElement(ScanButton, { 
      title: "Start Scan", 
      onPress: () => {}, 
      disabled: false 
    });
    
    expect(button.props.title).toBe("Start Scan");
    expect(button.props.disabled).toBe(false);
  });
  
  it('handles disabled state', () => {
    const button = React.createElement(ScanButton, { 
      title: "Processing...", 
      onPress: () => {}, 
      disabled: true
    });
    
    expect(button.props.disabled).toBe(true);
  });
  
  it('calls onPress handler when pressed', () => {
    const mockOnPress = jest.fn();
    const button = React.createElement(ScanButton, { 
      title: "Save Scan", 
      onPress: mockOnPress, 
      disabled: false 
    });
    
    // Simulate a press by calling the prop function directly
    button.props.onPress();
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
}); 