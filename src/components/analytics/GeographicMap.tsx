/**
 * Geographic distribution map component.
 * Shows volunteer and event distribution across regions.
 */
import type React from 'react';
import { ComposableMap, Geographies, Geography, Marker, Annotation } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { useGetGeographicDataQuery } from '../../services/analyticsApi';
import { useAppSelector } from '../../hooks/redux';
import { type DateRangeEnum } from '../../types/analytics';
import { Loader2 } from 'lucide-react';

// US states GeoJSON URL
const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// Region to state mapping (simplified)
const regionStates: Record<string, string[]> = {
  Northeast: ['NY', 'PA', 'NJ', 'CT', 'MA', 'VT', 'NH', 'ME', 'RI'],
  Southeast: ['FL', 'GA', 'SC', 'NC', 'VA', 'WV', 'KY', 'TN', 'AL', 'MS', 'LA', 'AR'],
  Midwest: ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  West: ['CA', 'WA', 'OR', 'NV', 'ID', 'UT', 'AZ', 'NM', 'CO', 'WY', 'MT', 'AK', 'HI'],
};

export const GeographicMap: React.FC = () => {
  const dateRange = useAppSelector((state) => state.analytics.dateRange);
  const { data, isLoading, error } = useGetGeographicDataQuery({
    dateRange: dateRange as DateRangeEnum,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Unable to load geographic data</p>
      </div>
    );
  }

  // Create color scale based on volunteer count
  const volunteerCounts = data.regions.map((r: any) => r.volunteers);
  const colorScale = scaleQuantile<string>().domain(volunteerCounts).range([
    '#E0E7FF', // lightest
    '#C7D2FE',
    '#A5B4FC',
    '#818CF8',
    '#6366F1', // darkest
  ]);

  // Get color for a state based on its region
  const getStateColor = (stateName: string) => {
    for (const [regionName, states] of Object.entries(regionStates)) {
      if (states.includes(stateName)) {
        const region = data.regions.find((r: any) => r.name === regionName);
        if (region) {
          return colorScale(region.volunteers);
        }
      }
    }
    return '#F3F4F6'; // Default gray
  };

  return (
    <div className="relative h-64">
      <ComposableMap projection="geoAlbersUsa" style={{ width: '100%', height: '100%' }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const stateName = geo.properties.name;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getStateColor(stateName)}
                  stroke="#E5E7EB"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#4F46E5' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 bg-white p-2 rounded-tr-lg shadow-sm">
        <p className="text-xs font-semibold text-gray-700 mb-1">Volunteers</p>
        <div className="flex items-center space-x-1">
          {['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1'].map((color, i) => (
            <div
              key={i}
              className="w-4 h-4"
              style={{ backgroundColor: color }}
              title={`Level ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Region summary */}
      <div className="absolute top-0 right-0 bg-white p-3 rounded-bl-lg shadow-sm max-w-xs">
        <p className="text-sm font-semibold text-gray-700 mb-2">Region Summary</p>
        <div className="space-y-1">
          {data.regions.map((region: any) => (
            <div key={region.name} className="flex justify-between text-xs">
              <span className="text-gray-600">{region.name}:</span>
              <span className="font-medium">
                {region.volunteers} volunteers, {region.events} events
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fallback component if map library not available
export const GeographicMapFallback: React.FC = () => {
  const dateRange = useAppSelector((state) => state.analytics.dateRange);
  const { data, isLoading, error } = useGetGeographicDataQuery({
    dateRange: dateRange as DateRangeEnum,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Unable to load geographic data</p>
      </div>
    );
  }

  // Simple table view as fallback
  return (
    <div className="h-64 overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Region
            </th>
            <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Volunteers
            </th>
            <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Events
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.regions.map((region: any) => (
            <tr key={region.name}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {region.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {region.volunteers.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.events}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
