import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
}

/**
 * Tovo Brand Mark
 * Custom minimal symbol representing a floating thought being focused
 * and captured into an actionable rectangular sheet or note.
 */
export const BrandMark: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Tovo symbol"
    >
      {/* Outer subtle note container */}
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4.5"
        className="stroke-current opacity-25"
        strokeWidth="1.5"
      />
      {/* Precision focused thought drop entering the note plane */}
      <circle
        cx="12"
        cy="9.5"
        r="2.75"
        className="fill-[#303FCA] dark:fill-[#5263FA]"
      />
      {/* Actionable horizon baseline representing grounded action */}
      <line
        x1="7.5"
        y1="16"
        x2="16.5"
        y2="16"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 24,
  className = '',
  showWordmark = true,
  showTagline = false,
}) => {
  return (
    <div className={`flex items-center gap-2 shrink-0 whitespace-nowrap ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-[#EFEFE9] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center text-[#20231F] dark:text-[#F2F1ED] transition-colors shrink-0">
        <BrandMark size={size} />
      </div>
      {showWordmark && (
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-[16px] tracking-[-0.02em] text-[#20231F] dark:text-[#F2F1ED] leading-none whitespace-nowrap">
            Tovo
          </span>
          {showTagline && (
            <span className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] tracking-tight mt-0.5 whitespace-nowrap">
              Capture it. Get it done.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
