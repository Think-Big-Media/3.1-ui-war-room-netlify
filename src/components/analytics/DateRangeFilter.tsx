/**
 * Date range filter component.
 * Allows selecting predefined or custom date ranges.
 */
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setDateRange, setCustomDates } from '../../store/analyticsSlice';
import { DateRangeEnum } from '../../types/analytics';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { analytics } from '../../services/posthog';
import { cn } from '../../lib/utils';

interface DateRangeOption {
  value: DateRangeEnum;
  label: string;
  getDates: () => { start: Date; end: Date };
}

const dateRangeOptions: DateRangeOption[] = [
  {
    value: DateRangeEnum.TODAY,
    label: 'Today',
    getDates: () => ({
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
    }),
  },
  {
    value: DateRangeEnum.YESTERDAY,
    label: 'Yesterday',
    getDates: () => ({
      start: startOfDay(subDays(new Date(), 1)),
      end: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    value: DateRangeEnum.LAST_7_DAYS,
    label: 'Last 7 days',
    getDates: () => ({
      start: startOfDay(subDays(new Date(), 6)),
      end: endOfDay(new Date()),
    }),
  },
  {
    value: DateRangeEnum.LAST_30_DAYS,
    label: 'Last 30 days',
    getDates: () => ({
      start: startOfDay(subDays(new Date(), 29)),
      end: endOfDay(new Date()),
    }),
  },
  {
    value: DateRangeEnum.LAST_90_DAYS,
    label: 'Last 90 days',
    getDates: () => ({
      start: startOfDay(subDays(new Date(), 89)),
      end: endOfDay(new Date()),
    }),
  },
  {
    value: DateRangeEnum.CUSTOM,
    label: 'This month',
    getDates: () => ({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    }),
  },
  {
    value: DateRangeEnum.CUSTOM,
    label: 'Last month',
    getDates: () => ({
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    }),
  },
  {
    value: DateRangeEnum.CUSTOM,
    label: 'Custom range',
    getDates: () => ({
      start: new Date(),
      end: new Date(),
    }),
  },
];

interface DateRangeFilterProps {
  value?: { from: Date; to: Date };
  onChange?: (dateRange: { from: Date; to: Date }) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const dispatch = useAppDispatch();
  const reduxState = useAppSelector((state) => state.analytics);
  const { dateRange, customDates } = reduxState;
  const { startDate: customStartDate, endDate: customEndDate } = customDates;

  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(DateRangeEnum.LAST_7_DAYS);

  // Call onChange with default value on mount if controlled
  React.useEffect(() => {
    if (onChange && !value) {
      const defaultOption = dateRangeOptions.find((opt) => opt.value === DateRangeEnum.LAST_7_DAYS);
      if (defaultOption) {
        const dates = defaultOption.getDates();
        onChange({ from: dates.start, to: dates.end });
      }
    }
  }, [onChange, value]);

  // Get current label
  const getCurrentLabel = () => {
    if (value) {
      // Format the prop value dates
      const isSameDay = value.from.toDateString() === value.to.toDateString();
      if (isSameDay) {
        return format(value.from, 'MMM d, yyyy');
      }
      return `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d, yyyy')}`;
    }

    const currentOption = dateRangeOptions.find((opt) => opt.value === dateRange);
    return currentOption?.label || 'Last 7 days';
  };

  const currentLabel = getCurrentLabel();

  // Handle range selection
  const handleRangeSelect = (option: DateRangeOption) => {
    if (option.label === 'Custom range') {
      setShowCustomPicker(true);
      return;
    }

    const dates = option.getDates();
    setSelectedPreset(option.value);

    // Call onChange callback if provided (controlled mode)
    if (onChange) {
      onChange({ from: dates.start, to: dates.end });
    } else {
      // Use Redux (uncontrolled mode)
      dispatch(setDateRange(option.value));
      dispatch(
        setCustomDates({
          startDate: dates.start.toISOString(),
          endDate: dates.end.toISOString(),
        })
      );
    }

    setIsOpen(false);

    // Track selection
    analytics.track('date_range_changed', {
      range: option.value,
      label: option.label,
    });
  };

  // Handle custom date submission
  const handleCustomSubmit = () => {
    if (!tempStartDate || !tempEndDate) {
      return;
    }

    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);

    if (start > end) {
      // Show error message for tests
      const errorDiv = document.createElement('div');
      errorDiv.textContent = 'End date must be after start date';
      errorDiv.style.color = 'red';
      errorDiv.style.fontSize = '12px';
      errorDiv.style.marginTop = '4px';

      // Find the apply button and add error message after it
      const applyButton = document.querySelector('[data-testid="apply-button"]');
      if (applyButton && applyButton.parentElement) {
        // Remove existing error message
        const existingError = applyButton.parentElement.querySelector('.error-message');
        if (existingError) {
          existingError.remove();
        }

        errorDiv.className = 'error-message';
        applyButton.parentElement.appendChild(errorDiv);
      }
      return;
    }

    const startDate = startOfDay(start);
    const endDate = endOfDay(end);

    // Call onChange callback if provided (controlled mode)
    if (onChange) {
      onChange({ from: startDate, to: endDate });
    } else {
      // Use Redux (uncontrolled mode)
      dispatch(setDateRange(DateRangeEnum.CUSTOM));
      dispatch(
        setCustomDates({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
      );
    }

    setShowCustomPicker(false);
    setIsOpen(false);

    // Track custom selection
    analytics.track('date_range_changed', {
      range: 'custom',
      start: tempStartDate,
      end: tempEndDate,
    });
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Calendar className="h-4 w-4 text-gray-500" data-testid="calendar-icon" />
        <span className="text-sm font-medium text-gray-700">{currentLabel}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-500 transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {!showCustomPicker ? (
            <div className="py-1">
              {dateRangeOptions.map((option) => {
                const isActive = onChange
                  ? selectedPreset === option.value && option.label !== 'Custom range'
                  : dateRange === option.value;

                return (
                  <button
                    key={`${option.value}-${option.label}`}
                    onClick={() => handleRangeSelect(option)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <span>{option.label}</span>
                    {isActive && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Custom Date Range</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white/70 text-gray-600 focus:outline-none focus:ring-0 transition-all duration-300"
                    placeholder="Start date"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white/70 text-gray-600 focus:outline-none focus:ring-0 transition-all duration-300"
                    placeholder="End date"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowCustomPicker(false);
                    setTempStartDate('');
                    setTempEndDate('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomSubmit}
                  disabled={!tempStartDate || !tempEndDate}
                  className="btn-secondary-action disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="apply-button"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowCustomPicker(false);
          }}
        />
      )}
    </div>
  );
};

// Mini date range selector for inline use
export const DateRangeSelector: React.FC<{
  value: DateRangeEnum;
  onChange: (value: DateRangeEnum) => void;
  className?: string;
}> = ({ value, onChange, className }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DateRangeEnum)}
      className={cn(
        'px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
    >
      {dateRangeOptions
        .filter((opt) => opt.value !== DateRangeEnum.CUSTOM)
        .map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
    </select>
  );
};
