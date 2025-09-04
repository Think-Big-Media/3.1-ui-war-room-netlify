/**
 * Builder.io Component Registry
 * Registers War Room components for visual editing in Builder
 */

import { Builder } from '@builder.io/react';
import Dashboard from './pages/Dashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AutomationDashboard from './pages/AutomationDashboard';
import DocumentIntelligence from './pages/DocumentIntelligence';
import SettingsPage from './pages/SettingsPage';

// Import layout components
import { MainLayout } from './components/layout/MainLayout';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';

// Import common components
import { CommandCenter } from './components/CommandCenter';
import { FeatureCard } from './components/FeatureCard';
import { RecentActivity } from './components/RecentActivity';
import { QuickActions } from './components/QuickActions';

// Set your Builder.io API key
Builder.init(import.meta.env.VITE_BUILDER_IO_KEY || 'YOUR_BUILDER_IO_API_KEY');

// Register page components
Builder.registerComponent(Dashboard, {
  name: 'Dashboard',
  description: 'Main War Room dashboard with overview metrics',
  inputs: [],
  defaultStyles: {
    minHeight: '100vh',
  },
});

Builder.registerComponent(AnalyticsDashboard, {
  name: 'AnalyticsDashboard',
  description: 'Campaign analytics and performance metrics',
  inputs: [],
  defaultStyles: {
    minHeight: '100vh',
  },
});

Builder.registerComponent(AutomationDashboard, {
  name: 'AutomationDashboard',
  description: 'Workflow automation and campaign rules',
  inputs: [],
  defaultStyles: {
    minHeight: '100vh',
  },
});

Builder.registerComponent(DocumentIntelligence, {
  name: 'DocumentIntelligence',
  description: 'AI-powered document analysis and insights',
  inputs: [],
  defaultStyles: {
    minHeight: '100vh',
  },
});

Builder.registerComponent(SettingsPage, {
  name: 'SettingsPage',
  description: 'User and organization settings',
  inputs: [],
  defaultStyles: {
    minHeight: '100vh',
  },
});

// Register layout components
Builder.registerComponent(MainLayout, {
  name: 'MainLayout',
  description: 'Main application layout with sidebar and navbar',
  inputs: [],
  canHaveChildren: true,
  defaultStyles: {
    minHeight: '100vh',
  },
});

Builder.registerComponent(Sidebar, {
  name: 'Sidebar',
  description: 'Navigation sidebar',
  inputs: [],
});

Builder.registerComponent(Navbar, {
  name: 'Navbar',
  description: 'Top navigation bar',
  inputs: [],
});

// Register feature components
Builder.registerComponent(CommandCenter, {
  name: 'CommandCenter',
  description: 'War Room command center with key metrics',
  inputs: [
    {
      name: 'title',
      type: 'string',
      defaultValue: 'Command Center',
    },
    {
      name: 'showMetrics',
      type: 'boolean',
      defaultValue: true,
    },
  ],
});

Builder.registerComponent(FeatureCard, {
  name: 'FeatureCard',
  description: 'Feature showcase card',
  inputs: [
    {
      name: 'title',
      type: 'string',
      required: true,
    },
    {
      name: 'description',
      type: 'string',
    },
    {
      name: 'icon',
      type: 'string',
      enum: ['users', 'calendar', 'messages', 'chart', 'file', 'settings'],
    },
    {
      name: 'link',
      type: 'string',
    },
  ],
});

Builder.registerComponent(RecentActivity, {
  name: 'RecentActivity',
  description: 'Recent campaign activity feed',
  inputs: [
    {
      name: 'limit',
      type: 'number',
      defaultValue: 5,
    },
  ],
});

Builder.registerComponent(QuickActions, {
  name: 'QuickActions',
  description: 'Quick action buttons for common tasks',
  inputs: [
    {
      name: 'actions',
      type: 'list',
      subFields: [
        {
          name: 'label',
          type: 'string',
        },
        {
          name: 'action',
          type: 'string',
        },
        {
          name: 'icon',
          type: 'string',
        },
      ],
    },
  ],
});

// Export for use in the app
export { Builder };
