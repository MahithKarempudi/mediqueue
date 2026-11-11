import React, { useEffect } from 'react';
import {
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// 1. BUTTON COMPONENT
// ============================================================================

export type ButtonVariant =
  | 'primary'
  | 'teal'
  | 'navy'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-mediblue-600 text-white hover:bg-mediblue-700 active:bg-mediblue-800 shadow-sm focus-visible:ring-mediblue-600',
  teal:
    'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm focus-visible:ring-teal-600',
  navy:
    'bg-navy-950 text-white hover:bg-navy-900 active:bg-navy-800 shadow-sm focus-visible:ring-navy-900',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200/80 active:bg-slate-300/70 border border-slate-200/80 focus-visible:ring-slate-400',
  outline:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 shadow-sm focus-visible:ring-slate-400',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:ring-red-600',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md font-medium',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg font-semibold',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl font-semibold',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer ${
        BUTTON_VARIANTS[variant]
      } ${BUTTON_SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};

// ============================================================================
// 2. STATUS BADGE / PILL COMPONENT
// ============================================================================

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'teal'
  | 'navy'
  | 'neutral'
  | 'indigo';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

const BADGE_STYLES: Record<BadgeVariant, { pill: string; dot: string }> = {
  success: {
    pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    pill: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  danger: {
    pill: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-500',
  },
  info: {
    pill: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
  },
  teal: {
    pill: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-500',
  },
  indigo: {
    pill: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  navy: {
    pill: 'bg-slate-900 text-white border-slate-800',
    dot: 'bg-teal-400',
  },
  neutral: {
    pill: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  dot = false,
  pulse = false,
  className = '',
}) => {
  const style = BADGE_STYLES[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight ${style.pill} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot} ${
            pulse ? 'animate-pulse' : ''
          }`}
        />
      )}
      {children}
    </span>
  );
};

// ============================================================================
// 3. PAGE HEADER COMPONENT
// ============================================================================

export interface PageHeaderProps {
  portalLabel?: string;
  badge?: string;
  portalBadgeVariant?: BadgeVariant;
  metaText?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  portalLabel,
  badge,
  portalBadgeVariant = 'teal',
  metaText,
  title,
  subtitle,
  actions,
}) => {
  const activeBadge = portalLabel || badge;
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-clinical">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5">
          {(activeBadge || metaText) && (
            <div className="flex flex-wrap items-center gap-2.5">
              {activeBadge && (
                <Badge variant={portalBadgeVariant} dot>
                  {activeBadge}
                </Badge>
              )}
              {metaText && (
                <span className="text-xs font-medium text-slate-500 font-mono">
                  {metaText}
                </span>
              )}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 4. METRIC CARD COMPONENT
// ============================================================================

export type MetricTone = 'blue' | 'teal' | 'emerald' | 'amber' | 'rose' | 'red' | 'indigo' | 'slate' | 'navy';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  subtitle?: string;
  badgeText?: string;
  badgeVariant?: BadgeVariant;
  icon?: React.ReactNode;
  tone?: MetricTone;
  accent?: MetricTone;
  progress?: number;
  trend?: {
    value: string;
    direction?: 'up' | 'down' | 'neutral';
  };
}

const TONE_ACCENTS: Record<MetricTone, { iconBg: string; bar: string; borderTop: string }> = {
  blue: {
    iconBg: 'bg-sky-50 text-mediblue-600 border-sky-200/70',
    bar: 'bg-mediblue-600',
    borderTop: 'border-t-mediblue-600',
  },
  teal: {
    iconBg: 'bg-teal-50 text-teal-700 border-teal-200/70',
    bar: 'bg-teal-600',
    borderTop: 'border-t-teal-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    bar: 'bg-emerald-600',
    borderTop: 'border-t-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-700 border-amber-200/70',
    bar: 'bg-amber-500',
    borderTop: 'border-t-amber-500',
  },
  rose: {
    iconBg: 'bg-red-50 text-red-700 border-red-200/70',
    bar: 'bg-red-600',
    borderTop: 'border-t-red-600',
  },
  red: {
    iconBg: 'bg-red-50 text-red-700 border-red-200/70',
    bar: 'bg-red-600',
    borderTop: 'border-t-red-600',
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
    bar: 'bg-indigo-600',
    borderTop: 'border-t-indigo-600',
  },
  slate: {
    iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
    bar: 'bg-slate-700',
    borderTop: 'border-t-slate-700',
  },
  navy: {
    iconBg: 'bg-slate-100 text-slate-800 border-slate-200',
    bar: 'bg-slate-900',
    borderTop: 'border-t-slate-900',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  subtitle,
  badgeText,
  badgeVariant = 'neutral',
  icon,
  tone,
  accent: accentProp,
  progress,
  trend,
}) => {
  const resolvedTone = tone || accentProp || 'blue';
  const accent = TONE_ACCENTS[resolvedTone] || TONE_ACCENTS.blue;
  const resolvedSub = subtext || subtitle;
  const resolvedBadge = badgeText || trend?.value;
  return (
    <div
      className={`bg-white border border-slate-200/90 border-t-2 ${accent.borderTop} rounded-xl p-4 sm:p-5 shadow-clinical flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </span>
          {icon && (
            <div className={`p-2 rounded-lg border ${accent.iconBg} shrink-0`}>
              {icon}
            </div>
          )}
        </div>

        <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            {value}
          </span>
          {resolvedBadge && <Badge variant={badgeVariant}>{resolvedBadge}</Badge>}
        </div>
      </div>

      {(typeof progress === 'number' || resolvedSub) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          {typeof progress === 'number' && (
            <div className="mb-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${accent.bar}`}
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          )}
          {resolvedSub && (
            <p className="text-xs text-slate-500 font-medium">{resolvedSub}</p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. CARD & SECTION HEADER
// ============================================================================

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  noPadding = false,
  padding,
}) => {
  const padClass = noPadding || padding === 'none'
    ? ''
    : padding === 'sm'
    ? 'p-3.5 sm:p-4'
    : padding === 'md'
    ? 'p-4 sm:p-5'
    : 'p-5 sm:p-6';

  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-xl shadow-clinical ${padClass} ${className}`}
    >
      {children}
    </div>
  );
};

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200/80 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/70">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight font-display">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

// ============================================================================
// 6. SEARCH INPUT & FORM FIELDS
// ============================================================================

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onClear?: () => void;
  onChange?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onClear,
  onChange,
  className = '',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;
    onChange(e.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// 7. NOTICE / FEEDBACK BANNERS
// ============================================================================

export interface NoticeBannerProps {
  tone?: 'success' | 'warning' | 'danger' | 'critical' | 'info';
  variant?: 'success' | 'warning' | 'danger' | 'critical' | 'info';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  tone,
  variant,
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const resolved = tone || variant || 'info';
  const normalizedTone = resolved === 'critical' ? 'danger' : resolved;
  const styles = {
    success: {
      box: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      box: 'bg-amber-50/90 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
    },
    danger: {
      box: 'bg-red-50/90 border-red-200 text-red-900',
      icon: <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />,
    },
    info: {
      box: 'bg-sky-50/90 border-sky-200 text-sky-900',
      icon: <Info className="h-4 w-4 text-mediblue-600 shrink-0 mt-0.5" />,
    },
  }[normalizedTone];

  return (
    <div
      className={`rounded-xl border p-4 flex items-start justify-between gap-3 shadow-sm animate-fade-in ${styles.box} ${className}`}
    >
      <div className="flex items-start gap-3 text-sm leading-relaxed">
        {styles.icon}
        <div>
          {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
          <div className="text-xs sm:text-sm opacity-95">{children}</div>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg opacity-70 hover:opacity-100 transition shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// 8. MODAL & CONFIRM DIALOG
// ============================================================================

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth,
  size,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const resolvedSize = maxWidth || size || 'lg';
  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[resolvedSize];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${widthClass} rounded-2xl border border-slate-200 bg-white shadow-clinical-lg animate-fade-in overflow-hidden my-8`}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-teal-600 shadow-2xs">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {title}
              </h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 9. EMPTY STATE & LOADING SKELETON
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-2xs">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 w-full rounded-xl bg-slate-200/70 border border-slate-200"
        />
      ))}
    </div>
  );
};

// ============================================================================
// 10. PAGINATION BAR
// ============================================================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-600">
      <span>
        Showing <strong className="font-semibold text-slate-900">{start}</strong> to{' '}
        <strong className="font-semibold text-slate-900">{end}</strong> of{' '}
        <strong className="font-semibold text-slate-900">{totalItems}</strong> records
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>
        <span className="px-2 font-semibold text-slate-800">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 11. BREADCRUMBS
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-slate-400 select-none">/</span>}
            {item.href ? (
              <a
                href={item.href}
                onClick={item.onClick}
                className="hover:text-teal-700 transition font-medium"
              >
                {item.label}
              </a>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-teal-700 transition font-medium"
              >
                {item.label}
              </button>
            ) : (
              <span className={isLast || item.active ? 'font-semibold text-slate-800' : 'font-medium text-slate-500'}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// ============================================================================
// 12. CONFIRMATION DIALOG
// ============================================================================

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      icon={
        variant === 'danger' ? (
          <AlertCircle className="w-5 h-5 text-red-600" />
        ) : variant === 'warning' ? (
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-mediblue-600" />
        )
      }
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'teal' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </Modal>
  );
};

// ============================================================================
// 13. TABS COMPONENT
// ============================================================================

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 border-b border-slate-200/90 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition -mb-px cursor-pointer ${
              isActive
                ? 'border-teal-600 text-teal-700 bg-teal-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// 14. DATA TABLE PRIMITIVES
// ============================================================================

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className = '', ...props }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
    <table className={`w-full text-left text-sm text-slate-700 border-collapse ${className}`} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', ...props }) => (
  <thead className={`bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider ${className}`} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', ...props }) => (
  <tbody className={`divide-y divide-slate-100 ${className}`} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = '', ...props }) => (
  <tr className={`transition-colors hover:bg-slate-50/60 ${className}`} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className = '', ...props }) => (
  <th className={`px-4 py-3 text-left font-semibold text-slate-600 select-none ${className}`} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = '', ...props }) => (
  <td className={`px-4 py-3.5 text-slate-700 align-middle ${className}`} {...props} />
);

// ============================================================================
// 15. TOOLTIP COMPONENT
// ============================================================================

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [visible, setVisible] = React.useState(false);

  const posClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded-md shadow-clinical-md whitespace-nowrap animate-fade-in ${posClass}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
