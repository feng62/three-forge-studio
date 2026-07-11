import type { SelectOption } from '../common/SelectControl';

export const PROVINCES: SelectOption[] = [
  { label: '北京市', value: 'bj' },
  { label: '上海市', value: 'sh' },
  { label: '广东省', value: 'gd' }
];

export const CITIES: Record<string, SelectOption[]> = {
  'bj': [{ label: '北京市', value: 'bj-city' }],
  'sh': [{ label: '上海市', value: 'sh-city' }],
  'gd': [
    { label: '广州市', value: 'gz' },
    { label: '深圳市', value: 'sz' },
    { label: '东莞市', value: 'dg' }
  ]
};

export function getProvinceLabel(value: string) {
  return PROVINCES.find(p => p.value === value)?.label || value;
}
export function getCityLabel(provValue: string, cityValue: string) {
  return CITIES[provValue]?.find(c => c.value === cityValue)?.label || cityValue;
}
