// The few Material Design Icons the app uses, from a subset of the
// MaterialCommunityIcons font (1.5 KB instead of 1.3 MB). Importing
// @expo/vector-icons' MaterialCommunityIcons would also pull every icon set's
// glyph map into the JS bundle.
//
// To add an icon, add its name and code point (see @expo/vector-icons'
// glyphmaps/MaterialCommunityIcons.json) below, then regenerate the font with
// fonttools:
//
//   pyftsubset node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf \
//     --unicodes=U+F049D,U+F0A37,U+F0E0C,U+F0070,U+F0E49 \
//     --layout-features='' --no-hinting --desubroutinize \
//     --output-file=assets/fonts/RouletteIcons.ttf
import createIconSet from "@expo/vector-icons/createIconSet";

const glyphMap = {
  shuffle: 0xf049d,
  "city-variant-outline": 0xf0a37,
  "palette-outline": 0xf0e0c,
  bank: 0xf0070,
  "image-frame": 0xf0e49,
};

export const Icon = createIconSet(
  glyphMap,
  "roulette-icons",
  require("../assets/fonts/RouletteIcons.ttf"),
);
export type IconName = keyof typeof glyphMap;
