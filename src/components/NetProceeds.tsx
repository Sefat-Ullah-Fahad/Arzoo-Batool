import React, { useMemo, useState } from 'react';
import { money } from '../utils/format';
import { calculateNetProceeds } from '../utils/netProceeds';
import { Slider } from './MortgageCalculator';
import { calculatorInputClass } from './ui';

const preciseMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format;

const parseAmount = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));
const amountError = (value: number) =>
  !Number.isFinite(value) ? 'Enter a valid amount.' : value < 0 ? 'Amount cannot be negative.' : undefined;

export function NetProceedsCalculator() {
  const [price, setPrice] = useState(850000);
  const [payoffInput, setPayoffInput] = useState('420000');
  const [commission, setCommission] = useState(5);
  const [closing, setClosing] = useState(1);
  const [creditsInput, setCreditsInput] = useState('0');

  const payoff = parseAmount(payoffInput);
  const credits = parseAmount(creditsInput);
  const payoffError = amountError(payoff);
  const creditsError = amountError(credits);

  const r = useMemo(() => {
    if (payoffError || creditsError) return null;
    return calculateNetProceeds({ price, payoff, commission, closing, credits });
  }, [price, payoff, payoffError, commission, closing, credits, creditsError]);

  const amountFields = [
    { label: 'Remaining mortgage balance', value: payoffInput, set: setPayoffInput, error: payoffError },
    { label: 'Repairs or buyer credits', value: creditsInput, set: setCreditsInput, error: creditsError },
  ];

  return (
    <div className="grid overflow-hidden rounded-3xl border border-[var(--calc-border)] bg-[var(--calc-card)] lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-7 p-6 sm:p-8 lg:p-10">
        <Slider label="Expected sale price" value={price} min={100000} max={5000000} step={5000} onChange={setPrice} display={money(price)} />
        <Slider label="Agent commission" value={commission} min={0} max={7} step={0.25} onChange={setCommission} display={`${commission}%`} />
        <Slider label="Title, attorney & other closing costs" value={closing} min={0} max={3} step={0.1} onChange={setClosing} display={`${closing.toFixed(1)}%`} />
        <div className="grid gap-4 sm:grid-cols-2">
          {amountFields.map((field) => (
            <label key={field.label} className="block min-w-0">
              <span className="mb-2 block text-sm font-medium text-ink">{field.label}</span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={field.value}
                  onChange={(event) => field.set(event.target.value)}
                  aria-invalid={Boolean(field.error)}
                  className={`${calculatorInputClass} num pl-8 ${field.error ? 'border-[var(--calc-error)]' : ''}`}
                />
              </span>
              {field.error && <span className="mt-1.5 block text-xs text-[var(--calc-error)]" role="alert">{field.error}</span>}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col bg-[var(--calc-summary)] p-6 text-white sm:p-8 lg:p-10">
        <p className="text-xl text-white/60 sm:text-2xl lg:text-3xl">Estimated net proceeds</p>
        {r ? (
          <>
            <p className={`num mt-2 text-[clamp(2.75rem,6vw,4rem)] font-semibold leading-none tracking-[-0.04em] ${r.net < 0 ? 'text-[var(--calc-chart-primary)]' : 'text-white'}`} aria-live="polite">
              {preciseMoney(r.net)}
            </p>
            <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
              <li className="flex justify-between gap-4 py-3 text-[15px]">
                <span className="font-medium">Sale price</span>
                <span className="num shrink-0 font-medium">{preciseMoney(price)}</span>
              </li>
              {r.items.map((item) => (
                <li key={item.label} className="flex justify-between gap-4 py-3 text-[15px] text-white/75">
                  <span>{item.label}</span>
                  <span className="num shrink-0">−{preciseMoney(item.value)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-4 rounded-2xl border border-white/15 bg-white/[0.04] p-5 text-sm leading-relaxed text-white/75" role="status">
            Correct the highlighted amounts to see an updated estimate.
          </p>
        )}
        <p className="mt-auto pt-8 text-xs leading-relaxed text-white/50">
          A starting estimate. Attorney fees vary by property. Arzoo will prepare an exact seller net sheet for your home.
        </p>
      </div>
    </div>
  );
}
