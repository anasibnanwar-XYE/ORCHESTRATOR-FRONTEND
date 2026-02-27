import React from 'react';

interface ResponsiveFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

interface FormGroupProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Responsive form container
 */
export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  onSubmit,
  className = '',
}) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 sm:space-y-6 ${className}`}>
      {children}
    </form>
  );
};

/**
 * Form group with label and error handling
 */
export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  label,
  error,
  required,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1 sm:mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

/**
 * Responsive input field
 */
export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  className = '',
  required,
  ...props
}) => {
  return (
    <FormGroup label={label} error={error} required={required}>
      <input
        className={`
          w-full
          px-3 py-2
          border rounded-lg
          text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500/20
          transition-all duration-200
          ${error
            ? 'border-red-300 dark:border-red-500 focus:border-red-500'
            : 'border-zinc-300 dark:border-zinc-700 focus:border-brand-500 dark:focus:border-brand-500'
          }
          bg-white dark:bg-zinc-900/50
          text-zinc-900 dark:text-white
          placeholder-zinc-400 dark:placeholder-zinc-500
          ${className}
        `}
        {...props}
      />
      {helperText && !error && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{helperText}</p>
      )}
    </FormGroup>
  );
};

/**
 * Responsive select field
 */
export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  helperText,
  options,
  className = '',
  required,
  ...props
}) => {
  return (
    <FormGroup label={label} error={error} required={required}>
      <select
        className={`
          w-full
          px-3 py-2
          border rounded-lg
          text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500/20
          transition-all duration-200
          ${error
            ? 'border-red-300 dark:border-red-500 focus:border-red-500'
            : 'border-zinc-300 dark:border-zinc-700 focus:border-brand-500 dark:focus:border-brand-500'
          }
          bg-white dark:bg-zinc-900/50
          text-zinc-900 dark:text-white
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            {option.label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{helperText}</p>
      )}
    </FormGroup>
  );
};

/**
 * Responsive textarea field
 */
export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  required,
  ...props
}) => {
  return (
    <FormGroup label={label} error={error} required={required}>
      <textarea
        className={`
          w-full
          px-3 py-2
          border rounded-lg
          text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500/20
          transition-all duration-200
          resize-y
          min-h-[100px]
          ${error
            ? 'border-red-300 dark:border-red-500 focus:border-red-500'
            : 'border-zinc-300 dark:border-zinc-700 focus:border-brand-500 dark:focus:border-brand-500'
          }
          bg-white dark:bg-zinc-900/50
          text-zinc-900 dark:text-white
          placeholder-zinc-400 dark:placeholder-zinc-500
          ${className}
        `}
        {...props}
      />
      {helperText && !error && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{helperText}</p>
      )}
    </FormGroup>
  );
};

