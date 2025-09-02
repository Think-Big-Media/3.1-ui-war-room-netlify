// Mock for lucide-react icons
const React = require('react');

// Generic icon mock factory
const createMockIcon = (iconName) =>
  React.forwardRef((props, ref) =>
    React.createElement(
      'svg',
      {
        ...props,
        ref,
        'data-testid': props['data-testid'] || 'icon',
        'data-lucide': iconName,
        width: props.size || props.width || 24,
        height: props.size || props.height || 24,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      React.createElement('rect', { x: '3', y: '3', width: '18', height: '18' })
    )
  );

// Generic icon mock (fallback)
const MockIcon = createMockIcon('generic');

// Export commonly used icons
module.exports = {
  AlertCircle: createMockIcon('alert-circle'),
  AlertTriangle: createMockIcon('alert-triangle'),
  ArrowDown: createMockIcon('arrow-down'),
  ArrowUp: createMockIcon('arrow-up'),
  ArrowLeft: createMockIcon('arrow-left'),
  ArrowRight: createMockIcon('arrow-right'),
  ArrowUpRight: createMockIcon('arrow-up-right'),
  ArrowDownRight: createMockIcon('arrow-down-right'),
  BarChart: createMockIcon('bar-chart'),
  Bell: createMockIcon('bell'),
  Calendar: createMockIcon('calendar'),
  CheckCircle: createMockIcon('check-circle'),
  ChevronDown: createMockIcon('chevron-down'),
  ChevronLeft: createMockIcon('chevron-left'),
  ChevronRight: createMockIcon('chevron-right'),
  ChevronUp: createMockIcon('chevron-up'),
  Clock: createMockIcon('clock'),
  DollarSign: createMockIcon('dollar-sign'),
  Download: createMockIcon('download'),
  Eye: createMockIcon('eye'),
  EyeOff: createMockIcon('eye-off'),
  Filter: createMockIcon('filter'),
  Grid: createMockIcon('grid'),
  Heart: createMockIcon('heart'),
  Home: createMockIcon('home'),
  Info: createMockIcon('info'),
  LineChart: createMockIcon('line-chart'),
  List: createMockIcon('list'),
  LogIn: createMockIcon('log-in'),
  LogOut: createMockIcon('log-out'),
  Mail: createMockIcon('mail'),
  MapPin: createMockIcon('map-pin'),
  Menu: createMockIcon('menu'),
  MessageSquare: createMockIcon('message-square'),
  Minus: createMockIcon('minus'),
  MoreHorizontal: createMockIcon('more-horizontal'),
  MoreVertical: createMockIcon('more-vertical'),
  PieChart: createMockIcon('pie-chart'),
  Plus: createMockIcon('plus'),
  Search: createMockIcon('search'),
  Settings: createMockIcon('settings'),
  Share: createMockIcon('share'),
  Star: createMockIcon('star'),
  TrendingDown: createMockIcon('trending-down'),
  TrendingUp: createMockIcon('trending-up'),
  User: createMockIcon('user'),
  Users: createMockIcon('users'),
  X: createMockIcon('x'),
  Zap: createMockIcon('zap'),
  default: MockIcon,
  LucideIcon: MockIcon,
};
