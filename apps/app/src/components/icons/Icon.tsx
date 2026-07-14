import Svg, { Circle, Path, type SvgProps } from 'react-native-svg';

import { useTheme } from '@/theme';

export type IconName =
  | 'feed'
  | 'sleep'
  | 'diaper'
  | 'pump'
  | 'solids'
  | 'health'
  | 'growth'
  | 'plus'
  | 'minus'
  | 'close'
  | 'undo'
  | 'clock'
  | 'chevronRight'
  | 'note'
  | 'home'
  | 'baby'
  | 'menu';

export type IconProps = {
  name: IconName;
  size?: number;
  /** Any hex color; defaults to the theme's ink. */
  color?: string;
} & Omit<SvgProps, 'color'>;

/**
 * One rounded line-icon family: 24×24 grid, 2px stroke, round caps/joins, no
 * fills. Consistent stroke weight across every event type keeps the timeline calm.
 */
export function Icon({ name, size = 24, color, ...rest }: IconProps) {
  const theme = useTheme();
  const stroke = color ?? theme.color.ink;
  const common = {
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityRole="image"
      accessibilityLabel={`${name} icon`}
      {...rest}
    >
      {renderPaths(name, common)}
    </Svg>
  );
}

type PathCommon = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: 'none';
};

function renderPaths(name: IconName, c: PathCommon) {
  switch (name) {
    case 'feed': // bottle
      return (
        <>
          <Path {...c} d="M7 10h10v7a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z" />
          <Path {...c} d="M9 10V7h6v3M10 7V5h4v2" />
          <Path {...c} d="M9 13h6" />
        </>
      );
    case 'sleep': // moon
      return <Path {...c} d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" />;
    case 'diaper':
      return (
        <>
          <Path {...c} d="M4 8h16l-3 6a7 7 0 0 1-10 0z" />
          <Path {...c} d="M9 12h6" />
        </>
      );
    case 'pump': // droplet
      return <Path {...c} d="M12 4s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z" />;
    case 'solids': // bowl + spoon
      return (
        <>
          <Path {...c} d="M3 11h14a7 7 0 0 1-14 0z" />
          <Circle {...c} cx={20} cy={6} r={1.6} />
          <Path {...c} d="M20 8v11" />
        </>
      );
    case 'health': // heart
      return <Path {...c} d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11z" />;
    case 'growth': // rising line
      return <Path {...c} d="M4 16l5-5 3 3 7-8" />;
    case 'plus':
      return <Path {...c} d="M12 5v14M5 12h14" />;
    case 'minus':
      return <Path {...c} d="M5 12h14" />;
    case 'close':
      return <Path {...c} d="M6 6l12 12M18 6L6 18" />;
    case 'undo':
      return (
        <>
          <Path {...c} d="M8 8l-4 4 4 4" />
          <Path {...c} d="M4 12h10a6 6 0 0 1 6 6v1" />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle {...c} cx={12} cy={12} r={8} />
          <Path {...c} d="M12 7v5l3 2" />
        </>
      );
    case 'chevronRight':
      return <Path {...c} d="M9 6l6 6-6 6" />;
    case 'note':
      return (
        <>
          <Path {...c} d="M6 4h9l3 3v13H6z" />
          <Path {...c} d="M9 10h6M9 14h6" />
        </>
      );
    case 'home':
      return (
        <>
          <Path {...c} d="M4 11l8-6 8 6" />
          <Path {...c} d="M6 10v9h12v-9" />
        </>
      );
    case 'baby':
      return (
        <>
          <Circle {...c} cx={12} cy={11} r={7} />
          <Path {...c} d="M9.5 10h.01M14.5 10h.01" />
          <Path {...c} d="M9.5 14a3.5 3.5 0 0 0 5 0" />
        </>
      );
    case 'menu':
      return <Path {...c} d="M4 7h16M4 12h16M4 17h16" />;
  }
}
