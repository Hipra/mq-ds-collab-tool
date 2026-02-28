/**
 * memoQ Design System — Core Color Tokens
 * Source: https://design-system.memoq.com/?path=/docs/foundations-core-tokens-colors--playground
 */

export interface ColorToken {
  token: string;
  hex: string;
}

export interface ColorGroup {
  name: string;
  tokens: readonly ColorToken[];
}

export const MEMOQ_COLOR_GROUPS: readonly ColorGroup[] = [
  {
    name: 'Blue',
    tokens: [
      { token: 'blue-50', hex: '#F5FAFF' },
      { token: 'blue-100', hex: '#E7F3FF' },
      { token: 'blue-200', hex: '#C7E4FF' },
      { token: 'blue-300', hex: '#92CAFE' },
      { token: 'blue-400', hex: '#47A4FB' },
      { token: 'blue-500', hex: '#178CF6' },
      { token: 'blue-600', hex: '#097AE2' },
      { token: 'blue-700', hex: '#0363BF' },
      { token: 'blue-800', hex: '#014A8F' },
      { token: 'blue-900', hex: '#012A50' },
    ],
  },
  {
    name: 'Blue-gray',
    tokens: [
      { token: 'blue-gray-50', hex: '#FAFAFD' },
      { token: 'blue-gray-100', hex: '#EDECF2' },
      { token: 'blue-gray-200', hex: '#DAD8E4' },
      { token: 'blue-gray-300', hex: '#C7C5D4' },
      { token: 'blue-gray-400', hex: '#ACA9BD' },
      { token: 'blue-gray-500', hex: '#86829D' },
      { token: 'blue-gray-600', hex: '#615D7B' },
      { token: 'blue-gray-700', hex: '#4A4663' },
      { token: 'blue-gray-800', hex: '#3B3751' },
      { token: 'blue-gray-900', hex: '#302D42' },
    ],
  },
  {
    name: 'Gray',
    tokens: [
      { token: 'gray-50', hex: '#FAFAFA' },
      { token: 'gray-100', hex: '#F3F3F3' },
      { token: 'gray-200', hex: '#E3E3E3' },
      { token: 'gray-300', hex: '#CDCDCD' },
      { token: 'gray-400', hex: '#ADADAD' },
      { token: 'gray-500', hex: '#7F7F7F' },
      { token: 'gray-600', hex: '#595959' },
      { token: 'gray-700', hex: '#393939' },
      { token: 'gray-800', hex: '#292929' },
      { token: 'gray-900', hex: '#1F1F1F' },
    ],
  },
  {
    name: 'Green',
    tokens: [
      { token: 'green-50', hex: '#F8FFFC' },
      { token: 'green-100', hex: '#E4FBF1' },
      { token: 'green-200', hex: '#B5F5D9' },
      { token: 'green-300', hex: '#73EDB8' },
      { token: 'green-400', hex: '#34E096' },
      { token: 'green-500', hex: '#14C97B' },
      { token: 'green-600', hex: '#09AE67' },
      { token: 'green-700', hex: '#059054' },
      { token: 'green-800', hex: '#037041' },
      { token: 'green-900', hex: '#044B2C' },
    ],
  },
  {
    name: 'Orange',
    tokens: [
      { token: 'orange-50', hex: '#FFFBF8' },
      { token: 'orange-100', hex: '#FFF1E8' },
      { token: 'orange-200', hex: '#FFE0CA' },
      { token: 'orange-300', hex: '#FEBC91' },
      { token: 'orange-400', hex: '#FC914A' },
      { token: 'orange-500', hex: '#F47623' },
      { token: 'orange-600', hex: '#DD6210' },
      { token: 'orange-700', hex: '#B94E07' },
      { token: 'orange-800', hex: '#8D3C07' },
      { token: 'orange-900', hex: '#502407' },
    ],
  },
  {
    name: 'Purple',
    tokens: [
      { token: 'purple-50', hex: '#F4F2FF' },
      { token: 'purple-100', hex: '#E7E1FF' },
      { token: 'purple-200', hex: '#CFC4FF' },
      { token: 'purple-300', hex: '#B6A5FF' },
      { token: 'purple-400', hex: '#9B85FF' },
      { token: 'purple-500', hex: '#886CFF' },
      { token: 'purple-600', hex: '#765AED' },
      { token: 'purple-700', hex: '#604AC2' },
      { token: 'purple-800', hex: '#493990' },
      { token: 'purple-900', hex: '#2D2553' },
    ],
  },
  {
    name: 'Red',
    tokens: [
      { token: 'red-50', hex: '#FEF8F8' },
      { token: 'red-100', hex: '#FEE7E7' },
      { token: 'red-200', hex: '#FDC0C0' },
      { token: 'red-300', hex: '#FC8B8B' },
      { token: 'red-400', hex: '#F85F5F' },
      { token: 'red-500', hex: '#EF3F3F' },
      { token: 'red-600', hex: '#D52828' },
      { token: 'red-700', hex: '#B31515' },
      { token: 'red-800', hex: '#8D0D0D' },
      { token: 'red-900', hex: '#5A0808' },
    ],
  },
  {
    name: 'Yellow',
    tokens: [
      { token: 'yellow-50', hex: '#FFFDF6' },
      { token: 'yellow-100', hex: '#FFF7E1' },
      { token: 'yellow-200', hex: '#FFEAB1' },
      { token: 'yellow-300', hex: '#FFD769' },
      { token: 'yellow-400', hex: '#FFCA32' },
      { token: 'yellow-500', hex: '#FFBF09' },
      { token: 'yellow-600', hex: '#EFB000' },
      { token: 'yellow-700', hex: '#D09A00' },
      { token: 'yellow-800', hex: '#A77900' },
      { token: 'yellow-900', hex: '#6E5000' },
    ],
  },
];
