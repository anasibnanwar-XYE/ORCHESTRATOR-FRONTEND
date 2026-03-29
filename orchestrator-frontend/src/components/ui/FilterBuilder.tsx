import { Plus, X, Filter } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface FilterField {
  value: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: { label: string; value: string }[];
}

export interface FilterBuilderProps {
  fields: FilterField[];
  rules: FilterRule[];
  onChange: (rules: FilterRule[]) => void;
  className?: string;
}

const operatorsByType = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'equals', label: 'is exactly' },
    { value: 'not_contains', label: 'does not contain' },
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'greater', label: '>' },
    { value: 'less', label: '<' },
  ],
  date: [
    { value: 'equals', label: 'is' },
    { value: 'before', label: 'is before' },
    { value: 'after', label: 'is after' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ],
};

export function FilterBuilder({ fields, rules, onChange, className }: FilterBuilderProps) {
  const addRule = () => {
    const newRule: FilterRule = {
      id: Math.random().toString(36).substring(7),
      field: fields[0].value,
      operator: operatorsByType[fields[0].type][0].value,
      value: '',
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    const newRules = rules.map((rule) => {
      if (rule.id === id) {
        const updated = { ...rule, ...updates };
        if (updates.field && updates.field !== rule.field) {
          const fieldDef = fields.find((f) => f.value === updates.field);
          if (fieldDef) {
            updated.operator = operatorsByType[fieldDef.type][0].value;
            updated.value = '';
          }
        }
        return updated;
      }
      return rule;
    });
    onChange(newRules);
  };

  const removeRule = (id: string) => {
    onChange(rules.filter((rule) => rule.id !== id));
  };

  return (
    <div
      className={twMerge(
        'bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] p-4 sm:p-5 rounded-xl space-y-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2 text-[13px] font-medium text-[var(--color-text-primary)]">
        <Filter size={16} className="text-[var(--color-text-tertiary)]" />
        Advanced Filters
      </div>

      {rules.length === 0 ? (
        <div className="text-[12px] text-[var(--color-text-tertiary)] py-2">
          No filters applied. Data will not be restricted.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => {
            const fieldDef = fields.find((f) => f.value === rule.field) || fields[0];
            const availableOperators = operatorsByType[fieldDef.type];

            return (
              <div
                key={rule.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 group"
              >
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[11px] font-semibold uppercase text-[var(--color-text-tertiary)] w-10 shrink-0 hidden sm:block">
                    {index === 0 ? 'Where' : 'And'}
                  </span>
                  <select
                    value={rule.field}
                    onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                    className="flex-1 sm:w-[160px] h-9 px-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)] focus:border-[var(--color-neutral-900)] text-[var(--color-text-primary)]"
                  >
                    {fields.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
                    className="w-[120px] sm:w-[140px] shrink-0 h-9 px-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)] focus:border-[var(--color-neutral-900)] text-[var(--color-text-primary)]"
                  >
                    {availableOperators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {fieldDef.type === 'select' && fieldDef.options ? (
                    <select
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                      className="flex-1 min-w-[120px] h-9 px-3 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)] focus:border-[var(--color-neutral-900)] text-[var(--color-text-primary)]"
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      {fieldDef.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={
                        fieldDef.type === 'date'
                          ? 'date'
                          : fieldDef.type === 'number'
                            ? 'number'
                            : 'text'
                      }
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                      placeholder="Enter value..."
                      className="flex-1 min-w-[120px] h-9 px-3 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)] focus:border-[var(--color-neutral-900)] placeholder:text-[var(--color-text-tertiary)] text-[var(--color-text-primary)]"
                    />
                  )}

                  <button
                    onClick={() => removeRule(rule.id)}
                    className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] rounded-md transition-colors shrink-0"
                    title="Remove rule"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={addRule}
        className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-neutral-900)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-border-subtle)] px-3 py-1.5 rounded-lg transition-colors"
      >
        <Plus size={14} />
        Add Rule
      </button>
    </div>
  );
}
