/**
 * Victory Native v41+ 類型定義
 * 補充官方類型定義的不足
 */

declare module 'victory-native' {
  import { ReactElement } from 'react';
  import { ViewStyle, ColorValue } from 'react-native';

  // 基礎資料點類型
  export interface VictoryDataPoint {
    x: string | number;
    y: number;
    [key: string]: any;
  }

  // CartesianChart Props
  export interface CartesianChartProps {
    data: Record<string, unknown>[];
    xKey: string;
    yKeys: string[];
    domainPadding?: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
    };
    domain?: {
      x?: [number, number] | [string, string];
      y?: [number, number];
    };
    padding?: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
    };
    children: (props: CartesianChartRenderProps) => ReactElement;
    style?: ViewStyle;
  }

  // CartesianChart Render Props
  export interface CartesianChartRenderProps {
    points: {
      [key: string]: Array<{
        x: number;
        y: number;
        value: any;
      }>;
    };
    chartBounds: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
  }

  // Bar Component Props
  export interface BarProps {
    points: Array<{
      x: number;
      y: number;
      value: any;
    }>;
    chartBounds: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    color?: ColorValue;
    roundedCorners?: {
      topLeft?: number;
      topRight?: number;
      bottomLeft?: number;
      bottomRight?: number;
    };
    barWidth?: number;
  }

  // Line Component Props
  export interface LineProps {
    points: Array<{
      x: number;
      y: number;
      value: any;
    }>;
    color?: ColorValue;
    strokeWidth?: number;
    curve?: 'linear' | 'step' | 'natural' | 'bumpX' | 'bumpY' | 'cardinal' | 
            'cardinal50' | 'catmullRom' | 'catmullRom0' | 'catmullRom100' | 
            'monotoneX' | 'basis';
  }

  // Polar Chart Props
  export interface PolarChartProps {
    data: Array<{
      label: string;
      value: number;
      color?: ColorValue;
    }>;
    innerRadius?: number;
    padAngle?: number;
    labelRadius?: number;
    width?: number;
    height?: number;
  }

  // Pie Component Props
  export interface PieProps {
    slice: {
      startAngle: number;
      endAngle: number;
      data: {
        label: string;
        value: number;
        color?: ColorValue;
      };
    };
  }

  // 匯出元件
  export const CartesianChart: React.FC<CartesianChartProps>;
  export const Bar: React.FC<BarProps>;
  export const Line: React.FC<LineProps>;
  export const PolarChart: React.FC<PolarChartProps>;
  export const Pie: React.FC<PieProps>;
}