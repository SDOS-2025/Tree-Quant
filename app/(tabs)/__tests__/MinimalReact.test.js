// CommonJS imports
const React = require('react');
const { Text, View } = require('react-native');

// The simplest possible component
const SimpleText = () => <Text testID="simple-text">Hello, world!</Text>;

// Manual test - doesn't rely on testing-library
describe('Minimal React Test', () => {
  it('can create a React element', () => {
    // Just create the element, don't render it
    const element = React.createElement(SimpleText);
    expect(element.type).toBe(SimpleText);
  });

  it('can create a React element with props', () => {
    const props = { testID: 'test' };
    const element = React.createElement(View, props);
    expect(element.props.testID).toBe('test');
  });
}); 



