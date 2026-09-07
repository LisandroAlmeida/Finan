"use client";

export function ConfirmButton({
  label,
  confirmMessage,
  pending,
  onConfirm,
  className,
}: {
  label: string;
  confirmMessage: string;
  pending: boolean;
  onConfirm: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmMessage)) onConfirm();
      }}
      className={`${className} disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
