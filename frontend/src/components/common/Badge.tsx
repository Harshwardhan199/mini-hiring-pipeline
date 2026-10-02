import type { Stage } from '../../types/candidate.types.ts';
import { getStageConfig } from '../../utils/stage.utils.ts';

interface StageBadgeProps {
  stage: Stage | string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export function StageBadge({
  stage,
  size = 'md',
  showDot = true,
  className = '',
}: StageBadgeProps) {
  const config = getStageConfig(stage);

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs font-medium'
      : 'px-2.5 py-1 text-xs font-medium';

  const dotSizeClasses = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${config.dotColor} ${dotSizeClasses}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
