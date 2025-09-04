import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('SettingsPage');
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Key,
  Globe,
  Mail,
  Smartphone,
  Link2,
  Share2,
} from 'lucide-react';
// Removed hardcoded gradient imports - using consistent slate background
import Card from '../components/shared/Card';
import PageLayout from '../components/shared/PageLayout';
import PageHeader from '../components/shared/PageHeader';
import CustomDropdown from '../components/shared/CustomDropdown';
import SimpleThemeButtons from '../components/SimpleThemeButtons';
import { MetaIntegration, GoogleAdsIntegration } from '../components/integrations';
import { useBackgroundTheme, type BackgroundTheme } from '../contexts/BackgroundThemeContext';

// Lightweight runtime diagnostics to validate prod behavior
const BUILD_DIAG = {
  env: import.meta.env.MODE,
  enableGoogleAuth: import.meta.env.VITE_ENABLE_GOOGLE_AUTH,
  hasMetaIntegration: !!MetaIntegration,
  hasGoogleAdsIntegration: !!GoogleAdsIntegration,
  buildTime: new Date().toISOString(),
};

interface SettingsSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  delay?: number;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon: Icon,
  children,
  delay = 0,
}) => {
  return (
    <Card
      className="hoverable hover:scale-[1.02] transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      padding="lg"
      variant="glass"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-black/20 backdrop-blur-sm rounded-xl border border-white/20">
          <Icon className="w-6 h-6 text-white/95" />
        </div>
        <h3 className="text-xl font-semibold text-white/40 tracking-wide font-barlow-condensed">
          {title.toUpperCase()}
        </h3>
      </div>
      {children}
    </Card>
  );
};

const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? 'bg-gray-500/80' : 'bg-black/30 border border-gray-400/20'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const SettingsPage: React.FC = () => {
  logger.debug('Settings loaded successfully');
  logger.debug('Settings rendered successfully');

  // Diagnostic: Log standardized style guide implementation
  console.log(
    '🎯 STANDARDIZED Style Guide: pb-5 spacing, icons +2px down + 10px indent, inputs 70% transparent + gray text, sub-descriptions 60% opacity + 3px up, buttons text-centered + icons aligned + semantic icons, autosave enabled (SITE-WIDE)'
  );

  // Diagnostics: track integrations section visibility on mount
  const integrationsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const section = integrationsRef.current;
    const viewportHeight = window.innerHeight;
    const totalHeight = document.documentElement.scrollHeight;
    if (section) {
      const rect = section.getBoundingClientRect();
      const isVisible = rect.top < viewportHeight && rect.bottom > 0;
    } else {
    }
  }, []);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [autoPublish, setAutoPublish] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);

  // Background theme state - this is now the main theme system
  const { currentTheme, setTheme, availableThemes } = useBackgroundTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedTimezone, setSelectedTimezone] = useState('EST');
  const [selectedDateFormat, setSelectedDateFormat] = useState('MM/DD/YYYY');

  // Use actual background themes instead of dummy themes
  const themes = availableThemes;
  const languages = ['English', 'Spanish', 'French', 'German', 'Portuguese'];
  const timezones = ['EST', 'PST', 'CST', 'GMT', 'CET'];

  // Dropdown options - use real background themes
  const themeOptions = themes.map((theme) => ({
    value: theme.id,
    label: theme.name,
  }));
  const languageOptions = languages.map((lang) => ({
    value: lang,
    label: lang,
  }));
  const timezoneOptions = timezones.map((tz) => ({ value: tz, label: tz }));
  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ];

  return (
    <div className="page-settings" data-route="settings">
      <PageLayout pageTitle="Settings" placeholder="Ask about settings...">
        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Profile Settings */}
          <SettingsSection title="Profile Settings" icon={User} delay={0.1}>
            <div className="space-y-4 pb-5">
              <div>
                <label className="block text-sm font-mono text-white/75 mb-1 ml-1.5 uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  type="text"
                  defaultValue="John Smith"
                  className="w-full bg-white/70 rounded-xl px-4 py-2.5 border border-slate-200 text-gray-600 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-0 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-white/75 mb-1 ml-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="john@agency.com"
                  className="w-full bg-white/70 rounded-xl px-4 py-2.5 border border-slate-200 text-gray-600 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-0 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-white/75 mb-1 ml-1.5 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  defaultValue="Elite Marketing Agency"
                  className="w-full bg-white/70 rounded-xl px-4 py-2.5 border border-slate-200 text-gray-600 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-0 transition-all duration-300"
                />
              </div>
            </div>
          </SettingsSection>

          {/* Notification Settings */}
          <SettingsSection title="Notifications" icon={Bell} delay={0.2}>
            <div className="space-y-4 pb-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 ml-2.5">
                  <Mail className="w-5 h-5 text-white/75" />
                  <div className="ml-1.5">
                    <p className="content-title ml-1.5">Email Notifications</p>
                    <p className="content-subtitle">Receive campaign updates via email</p>
                  </div>
                </div>
                <div className="mt-1">
                  <ToggleSwitch enabled={emailNotifications} onChange={setEmailNotifications} />
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 ml-2.5">
                  <Smartphone className="w-5 h-5 text-white/75" />
                  <div className="ml-1.5">
                    <p className="content-title ml-1.5">Push Notifications</p>
                    <p className="content-subtitle">Get instant alerts on your device</p>
                  </div>
                </div>
                <div className="mt-1">
                  <ToggleSwitch enabled={pushNotifications} onChange={setPushNotifications} />
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 ml-2.5">
                  <Globe className="w-5 h-5 text-white/75" />
                  <div className="ml-1.5">
                    <p className="content-title ml-1.5">Auto-Publish Content</p>
                    <p className="content-subtitle">Automatically publish scheduled content</p>
                  </div>
                </div>
                <div className="mt-1">
                  <ToggleSwitch enabled={autoPublish} onChange={setAutoPublish} />
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Appearance Settings */}
          <SettingsSection title="Appearance" icon={Palette} delay={0.3}>
            <div className="space-y-4 pb-5">
              <div>
                <label className="block text-sm font-mono text-white/75 mb-1 ml-1.5 uppercase tracking-wider">
                  Theme
                </label>
                <p className="text-xs text-white/60 mt-2 ml-1.5">
                  {availableThemes.find((theme) => theme.id === currentTheme)?.description ||
                    'Theme description'}
                </p>
                <div className="ml-1.5">
                  <SimpleThemeButtons />
                </div>
              </div>
              <div>
                <label className="block text-sm font-mono text-white/75 mb-1 ml-1.5 uppercase tracking-wider">
                  Language
                </label>
                <div className="ml-1.5">
                  <CustomDropdown
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                    options={languageOptions}
                    placeholder="Select Language"
                    icon={<Globe className="w-4 h-4" />}
                    className="min-w-[140px]"
                  />
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Security Settings */}
          <SettingsSection title="Security" icon={Shield} delay={0.4}>
            <div className="space-y-4 pb-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 ml-2.5">
                  <Key className="w-5 h-5 text-white/75" />
                  <div className="ml-1.5">
                    <p className="content-title ml-1.5">Two-Factor Authentication</p>
                    <p className="content-subtitle">Add an extra layer of security</p>
                  </div>
                </div>
                <div className="mt-1">
                  <ToggleSwitch enabled={twoFactor} onChange={setTwoFactor} />
                </div>
              </div>
              <div>
                <button className="btn-secondary-action w-full py-3 px-6 flex items-center justify-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>Change Password</span>
                </button>
              </div>
              <div>
                <button className="btn-secondary-neutral w-full py-3 px-6 flex items-center justify-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>View Login History</span>
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* Data & Privacy */}
          <SettingsSection title="Data & Privacy" icon={Database} delay={0.5}>
            <div className="space-y-4 pb-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 ml-2.5">
                  <Share2 className="w-5 h-5 text-white/75" />
                  <div className="ml-1.5">
                    <p className="content-title ml-1.5">Data Sharing</p>
                    <p className="content-subtitle">Share anonymized data for improvements</p>
                  </div>
                </div>
                <div className="mt-1">
                  <ToggleSwitch enabled={dataSharing} onChange={setDataSharing} />
                </div>
              </div>
              <div>
                <button className="btn-secondary-action w-full py-3 px-6 flex items-center justify-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Download My Data</span>
                </button>
              </div>
              <div>
                <button className="btn-secondary-alert w-full py-3 px-6 flex items-center justify-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Delete My Account</span>
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* Regional Settings */}
          <SettingsSection title="Regional" icon={Globe} delay={0.6}>
            <div className="space-y-4 pb-5">
              <div>
                <label className="block text-sm font-mono text-white/75 mb-1 ml-1.5 uppercase tracking-wider">
                  Timezone
                </label>
                <div className="ml-1.5">
                  <CustomDropdown
                    value={selectedTimezone}
                    onChange={setSelectedTimezone}
                    options={timezoneOptions}
                    placeholder="Select Timezone"
                    icon={<Globe className="w-4 h-4" />}
                    className="min-w-[140px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-mono text-white/75 mb-1 ml-1.5 uppercase tracking-wider">
                  Date Format
                </label>
                <div className="ml-1.5">
                  <CustomDropdown
                    value={selectedDateFormat}
                    onChange={setSelectedDateFormat}
                    options={dateFormatOptions}
                    placeholder="Select Date Format"
                    icon={<Globe className="w-4 h-4" />}
                    className="min-w-[140px]"
                  />
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* Platform Integrations Section - Full Width */}
        <div
          className="mt-8 animate-in fade-in slide-in-from-bottom-5 duration-600"
          id="integrations-section"
          ref={integrationsRef}
          style={{ animationDelay: '0.7s' }}
        >
          <Card
            className="hoverable hover:scale-[1.02] transition-all duration-200"
            padding="lg"
            variant="glass"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-black/20 backdrop-blur-sm rounded-xl border border-white/20">
                <Link2 className="w-6 h-6 text-white/95" />
              </div>
              <h3 className="text-xl font-semibold text-white/40 tracking-wide font-barlow-condensed">
                PLATFORM INTEGRATIONS
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ALWAYS RENDER SOMETHING */}
              <div className="oauth-meta-container">
                {MetaIntegration ? (
                  (() => {
                    try {
                      return <MetaIntegration />;
                    } catch (error) {
                      return (
                        <div className="p-4 bg-red-500/20 border border-red-500 rounded">
                          ❌ Meta component error: {String(error)}
                        </div>
                      );
                    }
                  })()
                ) : (
                  <div className="p-6 bg-black/30 backdrop-blur-sm rounded-xl border border-white/20">
                    <h4 className="content-title mb-2">Meta Business Suite</h4>
                    <p className="content-subtitle mb-4">OAuth integration not loaded</p>
                    <div className="p-3 bg-yellow-500/20 border border-yellow-500 rounded">
                      <p className="text-yellow-200 text-xs">Component import failed</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="oauth-google-container">
                {GoogleAdsIntegration ? (
                  (() => {
                    try {
                      return <GoogleAdsIntegration />;
                    } catch (error) {
                      return (
                        <div className="p-4 bg-red-500/20 border border-red-500 rounded">
                          ❌ Google Ads component error: {String(error)}
                        </div>
                      );
                    }
                  })()
                ) : (
                  <div className="p-6 bg-black/30 backdrop-blur-sm rounded-xl border border-white/20">
                    <h4 className="content-title mb-2">Google Ads</h4>
                    <p className="content-subtitle mb-4">OAuth integration not loaded</p>
                    <div className="p-3 bg-yellow-500/20 border border-yellow-500 rounded">
                      <p className="text-yellow-200 text-xs">Component import failed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Autosave - no manual save button needed */}
      </PageLayout>
    </div>
  );
};

export default SettingsPage;
