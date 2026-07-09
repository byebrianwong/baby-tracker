import { Fraunces_400Regular, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
} from '@expo-google-fonts/hanken-grotesk';
import { useFonts } from 'expo-font';

/** Font modules registered with expo-font. The map key becomes the fontFamily. */
export const fontModules = {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  GeistMono_400Regular,
  GeistMono_500Medium,
};

/**
 * Concrete font-family names (each weight is its own family — RN does not
 * synthesize weights for custom fonts). The theme maps text roles to these.
 *   display = Fraunces · body/UI = Hanken Grotesk · timers = Geist Mono (tabular)
 */
export const FONT = {
  displayRegular: 'Fraunces_400Regular',
  displaySemiBold: 'Fraunces_600SemiBold',
  bodyRegular: 'HankenGrotesk_400Regular',
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemiBold: 'HankenGrotesk_600SemiBold',
  monoRegular: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
} as const;

/** Load all Baby Bean fonts. Returns [loaded, error] from expo-font. */
export function useLoadFonts(): [boolean, Error | null] {
  return useFonts(fontModules);
}
