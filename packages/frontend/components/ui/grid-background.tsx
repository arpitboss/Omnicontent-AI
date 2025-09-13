import React from 'react';
import { cn } from '@/lib/utils';

interface GridBackgroundProps {
    pattern?: 'dots' | 'lines' | 'diagonal' | 'subtle-dots';
    className?: string;
    children?: React.ReactNode;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
    pattern = 'dots',
    className,
    children
}) => {
    const backgroundClass = {
        'dots': 'dots-background',
        'lines': 'lines-background',
        'diagonal': 'diagonal-background',
        'subtle-dots': 'dots-background-subtle'
    }[pattern];

    return (
        <div className= { cn('relative', className) } >
        <div className={ cn('absolute inset-0 opacity-40', backgroundClass) } />
    { children }
    </div>
  );
};

interface ContentBoxProps {
    variant?: 'default' | 'premium' | 'floating';
    className?: string;
    children: React.ReactNode;
}

export const ContentBox: React.FC<ContentBoxProps> = ({
    variant = 'default',
    className,
    children
}) => {
    const baseClasses = 'relative';

    const variantClasses = {
        'default': 'bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6',
        'premium': 'glass-effect rounded-2xl p-8 strategic-border premium-shadow',
        'floating': 'glass-effect rounded-xl p-6 premium-shadow animate-float'
    }[variant];

    return (
        <div className= { cn(baseClasses, variantClasses, className) } >
        { children }
        </div>
  );
};
