import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva(
  // Base styles - CleanMyMac-inspired clean foundation
  [
    'relative bg-white',
    'border border-gray-200/60',
    'overflow-hidden',
    'transition-all duration-250 ease-out',
  ],
  {
    variants: {
      // Enhanced variants for professional design
      variant: {
        default: 'bg-card text-card-foreground rounded-lg shadow-sm',
        glass: 'glass-card text-card-foreground',
        'glass-light': 'glass-card-light text-card-foreground',
        // New CleanMyMac-inspired variants
        clean: 'bg-white border-gray-100 rounded-2xl shadow-sm hover:shadow-md',
        metric: 'bg-white border-gray-200/60 rounded-xl shadow-sm hover:shadow-lg',
        elevated: 'bg-white border-gray-100 rounded-2xl shadow-lg hover:shadow-xl',
      },

      // Size variants for different contexts
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },

      // Interactive variants
      interactive: {
        false: '',
        true: 'cursor-pointer hover:scale-[1.01] active:scale-[0.99] hover:border-blue-200/80',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, interactive }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const cardHeaderVariants = cva('flex flex-col space-y-1.5', {
  variants: {
    size: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, size, ...props }, ref) => (
    <div ref={ref} className={cn(cardHeaderVariants({ size }), className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

// Specialized Card variants for common use cases
interface MetricCardProps extends CardProps {
  trending?: 'up' | 'down' | 'neutral';
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, trending, accent = 'blue', ...props }, ref) => {
    const accentClasses = {
      blue: 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent',
      green: 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent',
      orange: 'border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-transparent',
      red: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent',
      purple: 'border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-transparent',
    };

    return (
      <Card
        ref={ref}
        className={cn(accentClasses[accent], className)}
        variant="metric"
        {...props}
      />
    );
  }
);
MetricCard.displayName = 'MetricCard';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, MetricCard };

// Export types
export type { CardProps, CardHeaderProps, MetricCardProps };
