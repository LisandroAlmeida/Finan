"use client";

import { useState } from "react";
import { AccountItem } from "./AccountItem";

type Account = {
  id: string;
  name: string;
  bank: string;
  type: "conta" | "cartao";
  dueDay: number | null;
  parentAccountId?: string | null;
  lastFourDigits: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
};

type CardOption = { id: string; name: string };

/** Um cartão titular + seus cartões adicionais, agrupados numa única célula
 * do grid. Clicar no cartão titular expande/oculta os adicionais — evita
 * poluir a tela quando há muitos cartões (ex: vários adicionais do mesmo
 * titular Bradesco). */
export function CardGroup({
  parent,
  additionalCards,
  cardOptions,
  updateAccount,
  deleteAccount,
}: {
  parent: Account;
  additionalCards: Account[];
  cardOptions: CardOption[];
  updateAccount: (formData: FormData) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasAdditionalCards = additionalCards.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <AccountItem
        account={parent}
        cardOptions={cardOptions}
        badgeText={
          hasAdditionalCards
            ? `${additionalCards.length} ${additionalCards.length > 1 ? "adicionais" : "adicional"}`
            : undefined
        }
        expanded={hasAdditionalCards ? expanded : undefined}
        onCardClick={hasAdditionalCards ? () => setExpanded((v) => !v) : undefined}
        updateAccount={updateAccount}
        deleteAccount={deleteAccount}
      />
      {hasAdditionalCards && expanded && (
        <div className="flex flex-col gap-2 border-l-2 border-black/10 pl-3 dark:border-white/10">
          {additionalCards.map((child) => (
            <AccountItem
              key={child.id}
              account={child}
              parentName={parent.name}
              cardOptions={cardOptions.filter((o) => o.id !== child.id)}
              updateAccount={updateAccount}
              deleteAccount={deleteAccount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
