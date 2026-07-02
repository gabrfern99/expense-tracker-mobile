import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors } from '@/theme';

export interface DonutSegment {
  key: string | number;
  value: number;
  color: string;
}

interface Props {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode; // rendered centered inside the ring
}

/**
 * A donut chart drawn with SVG stroke-dash arcs. Each segment's arc length is
 * proportional to its share of the total. A small gap between segments gives it
 * a refined, modern look.
 */
export function DonutChart({ segments, size = 220, strokeWidth = 26, children }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const gap = segments.length > 1 ? 2 : 0; // px gap between segments
  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Rotate so segments start at the top (12 o'clock). */}
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {total > 0 &&
            segments.map((seg) => {
              const fraction = seg.value / total;
              const arc = Math.max(fraction * circumference - gap, 0);
              const dashoffset = -offset;
              offset += fraction * circumference;
              return (
                <Circle
                  key={seg.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap={fraction === 1 ? 'butt' : 'round'}
                  strokeDasharray={`${arc} ${circumference - arc}`}
                  strokeDashoffset={dashoffset}
                  fill="none"
                />
              );
            })}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
