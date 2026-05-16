// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'rectangle.portrait.and.arrow.right': 'logout',
  'info.circle': 'info-outline',
  'location.fill': 'location-on',
  'location.slash': 'location-off',
  'checkmark.circle.fill': 'check-circle',
  'calendar': 'event',
  'doc.text': 'description',
  'person.circle': 'account-circle',
  'clock': 'schedule',
  'clock.fill': 'schedule',
  'envelope': 'email',
  'envelope.fill': 'email',
  'lock': 'lock',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'person': 'person',
  'phone': 'phone',
  'building.2': 'business',
  'building.2.fill': 'business',
  'location': 'location-on',
  'shield': 'shield',
  'person.fill': 'person',
  'info.circle.fill': 'info',
  'calendar.badge.plus': 'event-available',
  'doc.text.fill': 'description',
  'list.bullet.rectangle': 'format-list-bulleted',
  'checkmark.seal.fill': 'verified',
  'doc.text.magnifyingglass': 'find-in-page',
  'person.2.fill': 'groups',
  'person.badge.plus': 'person-add',
  'person.crop.circle.badge.checkmark': 'how-to-reg',
  'person.crop.circle.badge.xmark': 'person-remove',
  'chart.bar.fill': 'bar-chart',
  'hourglass': 'hourglass-empty',
  'arrow.clockwise': 'refresh',
} as IconMapping;

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
