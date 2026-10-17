import { formatRupiahString } from '../utils/formatters';

// Text input that keeps its value formatted as "1.234.567" like formatRupiahInput() in the original
export default function RupiahInput({ value, onChange, ...props }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(formatRupiahString(e.target.value))}
      {...props}
    />
  );
}
