"use client";

import { useState, useTransition } from "react";
import { BankBadge } from "./BankBadge";
import { ConfirmButton } from "./ConfirmButton";
import { BANK_OPTIONS, bankCardGradient } from "@/lib/banks";
import { EXPIRY_MONTHS, expiryYearOptions } from "@/lib/cardExpiry";

type Account = {
  id: string;
  name: string;
  bank: string;
  type: "conta" | "cartao";
  dueDay: number | null;
  lastFourDigits: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
};

function ChipIcon() {
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="33" height="25" rx="4" fill="url(#chip-gradient)" stroke="rgba(0,0,0,0.25)" />
      <line x1="0" y1="8.5" x2="34" y2="8.5" stroke="rgba(0,0,0,0.25)" />
      <line x1="0" y1="17.5" x2="34" y2="17.5" stroke="rgba(0,0,0,0.25)" />
      <line x1="11.5" y1="0" x2="11.5" y2="26" stroke="rgba(0,0,0,0.25)" />
      <line x1="22.5" y1="0" x2="22.5" y2="26" stroke="rgba(0,0,0,0.25)" />
      <defs>
        <linearGradient id="chip-gradient" x1="0" y1="0" x2="34" y2="26">
          <stop offset="0%" stopColor="#f2debb" />
          <stop offset="100%" stopColor="#c9a35a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ContactlessIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden
      className="text-white/85"
    >
      <path d="M7 4.5a12 12 0 0 1 0 15" opacity="0.45" />
      <path d="M10.3 7.5a8 8 0 0 1 0 9" opacity="0.7" />
      <path d="M13.6 10.3a4 4 0 0 1 0 3.4" />
    </svg>
  );
}

function CardVisual({ account }: { account: Account }) {
  const masked = `•••• •••• •••• ${account.lastFourDigits ?? "••••"}`;
  const validity =
    account.expiryMonth && account.expiryYear
      ? `${String(account.expiryMonth).padStart(2, "0")}/${String(account.expiryYear).slice(-2)}`
      : "--/--";

  return (
    <div
      className="flex aspect-[1.586/1] w-full flex-col justify-between rounded-2xl p-4 text-white shadow-md"
      style={{ backgroundImage: bankCardGradient(account.bank) }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-tight drop-shadow-sm">{account.name}</span>
        <ContactlessIcon />
      </div>
      <ChipIcon />
      <div>
        <p className="font-mono text-[15px] tracking-wider drop-shadow-sm">{masked}</p>
        <p className="mt-1 text-[11px] text-white/80">Validade {validity}</p>
      </div>
    </div>
  );
}

export function AccountItem({
  account,
  updateAccount,
  deleteAccount,
}: {
  account: Account;
  updateAccount: (formData: FormData) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateAccount(formData);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteAccount(account.id);
    });
  };

  if (editing) {
    return (
      <div className="rounded-2xl border border-black/10 p-3 text-sm dark:border-white/10">
        <form action={handleSave} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={account.id} />
          <input type="hidden" name="type" value={account.type} />
          <div className="flex flex-col">
            <label className="text-xs text-foreground/60">Nome</label>
            <input
              name="name"
              required
              defaultValue={account.name}
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-1 flex-col">
              <label className="text-xs text-foreground/60">Banco</label>
              <select
                name="bank"
                defaultValue={account.bank}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              >
                {BANK_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col">
              <label className="text-xs text-foreground/60">Dia vencimento</label>
              <input
                name="dueDay"
                type="number"
                min="1"
                max="31"
                defaultValue={account.dueDay ?? ""}
                className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            {account.type === "cartao" && (
              <>
                <div className="flex flex-col">
                  <label className="text-xs text-foreground/60">Últimos 4 dígitos</label>
                  <input
                    name="lastFourDigits"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]{0,4}"
                    defaultValue={account.lastFourDigits ?? ""}
                    className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-foreground/60">Validade</label>
                  <div className="flex items-center gap-1">
                    <select
                      name="expiryMonth"
                      defaultValue={account.expiryMonth ?? ""}
                      className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
                    >
                      <option value="">MM</option>
                      {EXPIRY_MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-foreground/50">/</span>
                    <select
                      name="expiryYear"
                      defaultValue={account.expiryYear ?? ""}
                      className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
                    >
                      <option value="">AA</option>
                      {expiryYearOptions(account.expiryYear).map((y) => (
                        <option key={y} value={y}>
                          {String(y).slice(-2)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="mt-1 flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border border-black/15 px-3 py-1.5 text-xs dark:border-white/20"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (account.type === "cartao") {
    return (
      <div className="flex flex-col gap-2">
        <CardVisual account={account} />
        <div className="flex items-center justify-end gap-3 px-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            Editar
          </button>
          <ConfirmButton
            label="Excluir"
            confirmMessage={`Excluir "${account.name}"? Essa ação não pode ser desfeita.`}
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/10">
      <BankBadge bank={account.bank} size={24} />
      <span className="flex-1 font-medium text-foreground" title={account.name}>
        {account.name}
      </span>
      <span className="text-foreground/50">conta</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-blue-600 hover:underline"
        >
          Editar
        </button>
        <ConfirmButton
          label="Excluir"
          confirmMessage={`Excluir "${account.name}"? Essa ação não pode ser desfeita.`}
          pending={pending}
          onConfirm={handleDelete}
          className="text-xs text-red-600 hover:underline"
        />
      </div>
    </div>
  );
}
