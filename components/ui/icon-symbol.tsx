// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'arrow.clockwise': 'refresh',
  'building.2': 'business',
  'building.2.fill': 'business',
  'calendar': 'calendar-today',
  'calendar.badge.plus': 'event-available',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.seal.fill': 'verified',
  'chevron.left': 'chevron-left',
  'house.fill': 'home',
  'clock': 'schedule',
  'clock.fill': 'schedule',
  'doc.text': 'description',
  'doc.text.fill': 'description',
  'doc.text.magnifyingglass': 'find-in-page',
  'envelope': 'email',
  'envelope.fill': 'email',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'info.circle': 'info',
  'info.circle.fill': 'info',
  'list.bullet.rectangle': 'format-list-bulleted',
  'location': 'location-on',
  'location.fill': 'location-on',
  'location.slash': 'location-off',
  'lock': 'lock',
  'paperplane.fill': 'send',
  'person': 'person',
  'person.2.fill': 'groups',
  'person.circle': 'account-circle',
  'person.fill': 'person',
  'phone': 'phone',
  'rectangle.portrait.and.arrow.right': 'logout',
  'shield': 'shield',
  'shield.fill': 'shield',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} satisfies Record<string, MaterialIconName>;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
