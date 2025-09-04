// Mock for recharts
const React = require('react');

const mockComponent = (name) =>
  React.forwardRef((props, ref) =>
    React.createElement(
      'div',
      {
        ...props,
        ref,
        'data-testid': name.toLowerCase(),
        className: `recharts-${name.toLowerCase()} ${props.className || ''}`.trim(),
      },
      props.children
    )
  );

module.exports = {
  ResponsiveContainer: mockComponent('ResponsiveContainer'),
  LineChart: mockComponent('LineChart'),
  AreaChart: mockComponent('AreaChart'),
  BarChart: mockComponent('BarChart'),
  PieChart: mockComponent('PieChart'),
  RadarChart: mockComponent('RadarChart'),
  ScatterChart: mockComponent('ScatterChart'),
  ComposedChart: mockComponent('ComposedChart'),
  Line: mockComponent('Line'),
  Area: mockComponent('Area'),
  Bar: mockComponent('Bar'),
  Cell: mockComponent('Cell'),
  Pie: mockComponent('Pie'),
  Radar: mockComponent('Radar'),
  Scatter: mockComponent('Scatter'),
  XAxis: mockComponent('XAxis'),
  YAxis: mockComponent('YAxis'),
  CartesianGrid: mockComponent('CartesianGrid'),
  Tooltip: mockComponent('Tooltip'),
  Legend: mockComponent('Legend'),
  ReferenceLine: mockComponent('ReferenceLine'),
  ReferenceArea: mockComponent('ReferenceArea'),
  ReferenceDot: mockComponent('ReferenceDot'),
  ErrorBar: mockComponent('ErrorBar'),
  Brush: mockComponent('Brush'),
  PolarGrid: mockComponent('PolarGrid'),
  PolarAngleAxis: mockComponent('PolarAngleAxis'),
  PolarRadiusAxis: mockComponent('PolarRadiusAxis'),
  default: mockComponent,
};
