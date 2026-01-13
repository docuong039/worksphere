'use client';

import { useState, useCallback } from 'react';

interface DoneRatioSliderProps {
    value: number;
    onChange?: (value: number) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export function DoneRatioSlider({
    value,
    onChange,
    disabled = false,
    size = 'md',
    showLabel = true,
}: DoneRatioSliderProps) {
    const [localValue, setLocalValue] = useState(value);
    const [isDragging, setIsDragging] = useState(false);

    const getColor = (percent: number) => {
        if (percent >= 100) return '#22c55e'; // green-500
        if (percent >= 75) return '#84cc16'; // lime-500
        if (percent >= 50) return '#eab308'; // yellow-500
        if (percent >= 25) return '#f97316'; // orange-500
        return '#ef4444'; // red-500
    };

    const getGradient = () => {
        return `linear-gradient(to right, 
            #ef4444 0%, 
            #f97316 25%, 
            #eab308 50%, 
            #84cc16 75%, 
            #22c55e 100%
        )`;
    };

    const sizeClasses = {
        sm: { track: 'h-1.5', thumb: 'w-3 h-3', text: 'text-xs' },
        md: { track: 'h-2', thumb: 'w-4 h-4', text: 'text-sm' },
        lg: { track: 'h-3', thumb: 'w-5 h-5', text: 'text-base' },
    };

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = parseInt(e.target.value, 10);
            setLocalValue(newValue);
        },
        []
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        if (onChange && localValue !== value) {
            onChange(localValue);
        }
    }, [onChange, localValue, value]);

    const handleMouseDown = useCallback(() => {
        setIsDragging(true);
    }, []);

    const displayValue = isDragging ? localValue : value;
    const currentColor = getColor(displayValue);

    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <div
                    className={`absolute inset-0 rounded-full overflow-hidden ${sizeClasses[size].track}`}
                    style={{
                        background: '#e5e7eb',
                    }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-150"
                        style={{
                            width: `${displayValue}%`,
                            background: getGradient(),
                            backgroundSize: `${100 / (displayValue / 100)}% 100%`,
                        }}
                    />
                </div>

                <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={displayValue}
                    onChange={handleChange}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchEnd={handleMouseUp}
                    disabled={disabled}
                    className={`
                        relative w-full appearance-none bg-transparent cursor-pointer
                        disabled:cursor-not-allowed disabled:opacity-50
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:${sizeClasses[size].thumb}
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-110
                        [&::-moz-range-thumb]:${sizeClasses[size].thumb}
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-white
                        [&::-moz-range-thumb]:shadow-md
                    `}
                    style={{
                        // @ts-expect-error CSS custom property
                        '--thumb-color': currentColor,
                    }}
                />
            </div>

            {showLabel && (
                <span
                    className={`font-semibold min-w-[3rem] text-right ${sizeClasses[size].text}`}
                    style={{ color: currentColor }}
                >
                    {displayValue}%
                </span>
            )}
        </div>
    );
}

interface DoneRatioDisplayProps {
    value: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export function DoneRatioDisplay({
    value,
    size = 'sm',
    showLabel = true,
}: DoneRatioDisplayProps) {
    const getColor = (percent: number) => {
        if (percent >= 100) return '#22c55e';
        if (percent >= 75) return '#84cc16';
        if (percent >= 50) return '#eab308';
        if (percent >= 25) return '#f97316';
        return '#ef4444';
    };

    const sizeClasses = {
        sm: { height: 'h-1.5', text: 'text-xs', width: 'w-16' },
        md: { height: 'h-2', text: 'text-sm', width: 'w-20' },
        lg: { height: 'h-2.5', text: 'text-base', width: 'w-24' },
    };

    const color = getColor(value);

    return (
        <div className="flex items-center gap-2">
            <div
                className={`${sizeClasses[size].width} ${sizeClasses[size].height} bg-gray-200 rounded-full overflow-hidden`}
            >
                <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                        width: `${value}%`,
                        backgroundColor: color,
                    }}
                />
            </div>
            {showLabel && (
                <span
                    className={`font-medium ${sizeClasses[size].text}`}
                    style={{ color }}
                >
                    {value}%
                </span>
            )}
        </div>
    );
}
