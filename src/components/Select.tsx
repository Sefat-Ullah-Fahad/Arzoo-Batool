import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** Small caption shown above the value (hero / pill style) or as the accessible name. */
  label: string;
  /**
   * - `hero`: borderless, caption above the value (for the big search bar)
   * - `field`: bordered 48px control matching text inputs
   * - `pill`: compact rounded control for toolbars (sort, etc.)
   */
  variant?: 'hero' | 'field' | 'pill';
  icon?: React.ReactNode;
  className?: string;
  /** Show the caption inside a `field` control too. */
  showLabel?: boolean;
  searchable?: boolean;
}

/** Custom dropdown that replaces the native <select> look. */
export function Select(props: SelectProps) {
  if (props.searchable) return <SearchableSelect {...props} />;
  return <BasicSelect {...props} />;
}

function BasicSelect({ value, options, onChange, label, variant = 'field', icon, className = '', showLabel = false }: SelectProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Open upward when there isn't room below.
  useLayoutEffect(() => {
    if (!open || !root.current) return;
    const rect = root.current.getBoundingClientRect();
    const needed = Math.min(options.length * 44 + 16, 320);
    setDropUp(window.innerHeight - rect.bottom < needed && rect.top > needed);
    setActive(selectedIndex);
  }, [open, options.length, selectedIndex]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
    }
  };

  const triggerStyle = {
    hero: 'h-14 w-full rounded-xl px-3 text-left hover:bg-sand/70 sm:h-16 sm:px-4',
    field: `w-full rounded-xl border bg-white px-4 text-left ${showLabel ? 'h-14' : 'h-12'} ${open ? 'border-ink' : 'border-stone hover:border-ink/40'}`,
    pill: `h-10 rounded-full border bg-white pl-4 pr-3 text-sm ${open ? 'border-ink' : 'border-stone hover:border-ink/40'}`,
  }[variant];

  const stacked = variant === 'hero' || (variant === 'field' && showLabel);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${selected?.label ?? ''}`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex items-center gap-3 text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze/50 ${triggerStyle}`}
      >
        {icon && <span className="shrink-0 text-bronze">{icon}</span>}
        <span className="min-w-0 flex-1">
          {stacked && <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</span>}
          <span className={`block truncate ${variant === 'pill' ? 'font-medium' : 'text-[15px] font-medium'} ${stacked ? 'mt-0.5' : ''}`}>
            {variant === 'pill' && <span className="mr-1 font-normal text-muted">{label}:</span>}
            {selected?.label}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: dropUp ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute left-0 z-50 max-h-80 min-w-full overflow-y-auto rounded-2xl bg-white p-1.5 text-ink shadow-[0_24px_50px_-12px_rgb(0_0_0/0.28)] ring-1 ring-black/5 no-scrollbar ${
              dropUp ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'
            } ${variant === 'pill' ? 'right-0 left-auto w-max' : 'w-max max-w-[min(320px,calc(100vw-40px))]'}`}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`flex min-h-11 cursor-pointer items-center justify-between gap-6 rounded-xl px-3.5 text-[15px] transition-colors ${
                    i === active ? 'bg-sand' : ''
                  } ${isSelected ? 'font-medium' : ''}`}
                >
                  <span className="whitespace-nowrap">{o.label}</span>
                  <Check className={`h-4 w-4 shrink-0 text-bronze ${isSelected ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchableSelect({ value, options, onChange, label, variant = 'field', icon, className = '', showLabel = false }: SelectProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [popup, setPopup] = useState({ top: 0, left: 0, width: 280, maxHeight: 320 });
  const selected = options.find((o) => o.value === value) ?? options[0];
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return q ? options.filter((o) => o.label.toLocaleLowerCase().includes(q)) : options;
  }, [options, query]);
  const stacked = variant === 'hero' || (variant === 'field' && showLabel);
  const triggerStyle = {
    hero: 'h-14 w-full rounded-xl px-3 text-left hover:bg-sand/70 sm:h-16 sm:px-4',
    field: `w-full rounded-xl border bg-white px-4 text-left ${showLabel ? 'h-14' : 'h-12'} ${open ? 'border-ink' : 'border-stone hover:border-ink/40'}`,
    pill: `h-10 rounded-full border bg-white pl-4 pr-3 text-sm ${open ? 'border-ink' : 'border-stone hover:border-ink/40'}`,
  }[variant];

  useLayoutEffect(() => {
    if (!open || !root.current) return;
    const place = () => {
      const rect = root.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(Math.max(rect.width, 280), window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const up = below < Math.min(320, filtered.length * 44 + 64) && above > below;
      const maxHeight = Math.min(320, (up ? above : below));
      setPopup({ top: up ? rect.top - maxHeight - 8 : rect.bottom + 8, left, width, maxHeight });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    input.current?.focus();
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !panel.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (index: number) => {
    const option = filtered[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    setQuery('');
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(active);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      <button type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-label={`${label}: ${selected?.label ?? ''}`} onClick={() => { setOpen((wasOpen) => !wasOpen); setQuery(''); setActive(Math.max(0, options.findIndex((o) => o.value === value))); }} className={`flex items-center gap-3 text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze/50 ${triggerStyle}`}>
        {icon && <span className="shrink-0 text-bronze">{icon}</span>}
        <span className="min-w-0 flex-1">
          {stacked && <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</span>}
          <span className={`block truncate ${variant === 'pill' ? 'font-medium' : 'text-[15px] font-medium'} ${stacked ? 'mt-0.5' : ''}`}>
            {variant === 'pill' && <span className="mr-1 font-normal text-muted">{label}:</span>}{selected?.label}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div ref={panel} initial={{ opacity: 0, y: -5, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.985 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'fixed', top: popup.top, left: popup.left, width: popup.width, maxHeight: popup.maxHeight, zIndex: 1000 }} className="overflow-hidden rounded-2xl bg-white p-1.5 text-ink shadow-[0_24px_50px_-12px_rgb(0_0_0/0.28)] ring-1 ring-black/5">
              <label className="flex h-11 items-center gap-2 rounded-xl border-b border-stone px-3 text-muted">
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">Search {label}</span>
                <input ref={input} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={onKeyDown} aria-activedescendant={filtered.length ? `${id}-opt-${active}` : undefined} placeholder={`Search ${label.toLowerCase()}…`} className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
              </label>
              <ul ref={list} id={`${id}-list`} role="listbox" aria-label={label} style={{ maxHeight: Math.max(0, popup.maxHeight - 54) }} className="no-scrollbar overflow-y-auto pt-1">
                {filtered.map((option, index) => {
                  const isSelected = option.value === value;
                  return <li key={option.value} id={`${id}-opt-${index}`} data-index={index} role="option" aria-selected={isSelected} onPointerEnter={() => setActive(index)} onClick={() => choose(index)} className={`flex min-h-11 cursor-pointer items-center justify-between gap-6 rounded-xl px-3.5 text-[15px] transition-colors ${index === active ? 'bg-sand' : ''} ${isSelected ? 'font-medium' : ''}`}>
                    <span className="truncate">{option.label}</span><Check className={`h-4 w-4 shrink-0 text-bronze ${isSelected ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
                  </li>;
                })}
                {filtered.length === 0 && <li className="px-3.5 py-4 text-sm text-muted">No neighborhoods found.</li>}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}
    </div>
  );
}

/** Helper to build options from plain strings. */
export const opts = (values: (string | number)[], format: (v: string) => string = (v) => v): Option[] =>
  values.map((v) => ({ value: String(v), label: format(String(v)) }));
