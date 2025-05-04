// No JSX, just pure JS
const React = require('react');

describe('React without JSX', () => {
  it('can create React elements with createElement', () => {
    // No JSX, just plain createElement
    const element = React.createElement('div', { className: 'test' }, 'Hello');
    
    expect(element.type).toBe('div');
    expect(element.props.className).toBe('test');
    expect(element.props.children).toBe('Hello');
  });
  
  it('can handle nested elements', () => {
    const child = React.createElement('span', null, 'Child');
    const parent = React.createElement('div', null, child);
    
    expect(parent.props.children).toBe(child);
  });
}); 


