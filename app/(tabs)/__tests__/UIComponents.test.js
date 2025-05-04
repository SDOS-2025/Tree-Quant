const React = require('react');
const { render, fireEvent } = require('@testing-library/react-native');
const { View, Text, TouchableOpacity, TextInput } = require('react-native');

// Mock a simple Button component
const Button = ({ title, onPress, color = '#2E7D32' }) => (
  <TouchableOpacity
    onPress={onPress}
    testID="button"
    style={{ backgroundColor: color, padding: 10, borderRadius: 5 }}
  >
    <Text style={{ color: 'white', textAlign: 'center' }}>{title}</Text>
  </TouchableOpacity>
);

// Mock a Card component
const Card = ({ title, children }) => (
  <View testID="card" style={{ padding: 16, backgroundColor: 'white', borderRadius: 8, margin: 8 }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>
    {children}
  </View>
);

// Mock a counter component that uses state
const Counter = () => {
  const [count, setCount] = React.useState(0);
  
  return (
    <View testID="counter">
      <Text testID="count">{count}</Text>
      <Button title="Increment" onPress={() => setCount(count + 1)} />
    </View>
  );
};

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Test Button" onPress={() => {}} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(<Button title="Press Me" onPress={onPressMock} />);
    
    fireEvent.press(getByTestId('button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});

describe('Card Component', () => {
  it('renders with title and children', () => {
    const { getByText } = render(
      <Card title="Card Title">
        <Text>Card Content</Text>
      </Card>
    );
    
    expect(getByText('Card Title')).toBeTruthy();
    expect(getByText('Card Content')).toBeTruthy();
  });
});

describe('Counter Component (with state)', () => {
  it('starts at zero', () => {
    const { getByTestId } = render(<Counter />);
    expect(getByTestId('count').props.children).toBe(0);
  });

  it('increments when button is pressed', () => {
    const { getByTestId, getByText } = render(<Counter />);
    
    fireEvent.press(getByText('Increment'));
    expect(getByTestId('count').props.children).toBe(1);
    
    fireEvent.press(getByText('Increment'));
    expect(getByTestId('count').props.children).toBe(2);
  });
});

// Mock a form with user input
describe('Form Input Testing', () => {
  it('updates text input value', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <View>
        <Text>Input Test:</Text>
        <TextInput 
          placeholder="Enter text here" 
          onChangeText={onChangeTextMock} 
        />
      </View>
    );
    
    const input = getByPlaceholderText('Enter text here');
    fireEvent.changeText(input, 'Hello Test');
    
    expect(onChangeTextMock).toHaveBeenCalledWith('Hello Test');
  });
}); 