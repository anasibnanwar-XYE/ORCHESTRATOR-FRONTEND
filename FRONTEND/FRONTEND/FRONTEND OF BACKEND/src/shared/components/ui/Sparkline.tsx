import { useMemo, useId } from 'react';
import { twMerge } from 'tailwind-merge';

export interface SparklineProps {
  data: number[];
  color?: 'primary' | 'success' | 'warning' | 'danger' | string;
  className?: string;
  width?: number | string;
  height?: number;
  strokeWidth?: number;
  smooth?: boolean;
  fill?: boolean;
}

const colorMap: Record<string, string> = {
  primary: 'var(--color-neutral-900)',
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444',  // red-500
};

export function Sparkline({
  data,
  color = 'primary',
  className,
  width = '100%',
  height = 40,
  strokeWidth = 2,
  smooth = true,
  fill = true,
}: SparklineProps) {
  const gradientId = useId().replace(/:/g, ''); // Fix invalid ID characters for SVG URL

  const { pathD, areaD } = useMemo(() => {
    if (!data || data.length === 0) return { pathD: '', areaD: '' };
    
    // Add small padding to prevent strokes from being cut off at min/max
    const padding = 5; 
    const minData = Math.min(...data);
    const maxData = Math.max(...data);
    const range = (maxData - minData) || 1;
    const step = 100 / (data.length - 1 || 1);

    const points = data.map((val, i) => {
      // Calculate Y mapped to 0-100, then scale to account for padding
      const yPercent = ((val - minData) / range);
      const y = padding + (100 - (2 * padding)) * (1 - yPercent);
      return { x: i * step, y };
    });

    let pathStr = '';
    if (smooth) {
      pathStr = `M ${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        // Control points for cubic bezier to make it smooth
        const cpx1 = p0.x + (p1.x - p0.x) / 3;
        const cpx2 = p1.x - (p1.x - p0.x) / 3;
        pathStr += ` C ${cpx1},${p0.y} ${cpx2},${p1.y} ${p1.x},${p1.y}`;
      }
    } else {
      pathStr = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    }

    const areaPathStr = `${pathStr} L ${points[points.length - 1].x},120 L ${points[0].x},120 Z`;

    return { pathD: pathStr, areaD: areaPathStr };
  }, [data, smooth]);

  const strokeColor = colorMap[color] || color;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width={width}
      height={height}
      className={twMerge('overflow-visible', className)}
    >
      <defs>
        <linearGradient id={`gradient-${gradientId}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      
      {fill && (
        <path
          d={areaD}
          fill={`url(#gradient-${gradientId})`}
          className="transition-all duration-300 ease-in-out"
        />
      )}
      
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="transition-all duration-300 ease-in-out"
      />
    </svg>
  );
}
