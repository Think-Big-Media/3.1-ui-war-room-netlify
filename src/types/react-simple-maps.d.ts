declare module 'react-simple-maps' {
  import type React from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, any>;
    width?: number;
    height?: number;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }

  export interface GeographiesProps {
    geography: string | object;
    children?: (args: { geographies: any[] }) => React.ReactNode;
    parseGeographies?: (geography: any) => any[];
  }

  export interface GeographyProps {
    geography: any;
    children?: React.ReactNode;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onClick?: (geography: any, event: React.MouseEvent) => void;
    onMouseEnter?: (geography: any, event: React.MouseEvent) => void;
    onMouseLeave?: (geography: any, event: React.MouseEvent) => void;
    className?: string;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
    className?: string;
  }

  export interface AnnotationProps {
    subject: [number, number];
    dx?: number;
    dy?: number;
    curve?: number;
    children?: React.ReactNode;
    className?: string;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
  export const Annotation: React.FC<AnnotationProps>;
}
