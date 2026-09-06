import { bankInfo } from "@/lib/banks";

export function BankBadge({ bank, size = 28 }: { bank: string; size?: number }) {
  const info = bankInfo(bank);
  return (
    <span
      title={info.label}
      style={{
        backgroundColor: info.color,
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
    >
      {info.initials}
    </span>
  );
}
