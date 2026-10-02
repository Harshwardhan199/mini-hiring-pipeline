import type { Stage } from '../types/candidate.types.ts';

export interface StageConfig {
  name: Stage;
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentBorder: string;
  iconBg: string;
}

export const STAGE_CONFIGS: Record<Stage, StageConfig> = {
  Applied: {
    name: 'Applied',
    label: 'Applied',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    accentBorder: 'border-l-slate-400',
    iconBg: 'bg-slate-100 text-slate-600',
  },
  Screening: {
    name: 'Screening',
    label: 'Screening',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accentBorder: 'border-l-blue-500',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  Interview: {
    name: 'Interview',
    label: 'Interview',
    dotColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    accentBorder: 'border-l-indigo-500',
    iconBg: 'bg-indigo-50 text-indigo-600',
  },
  Offer: {
    name: 'Offer',
    label: 'Offer',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accentBorder: 'border-l-amber-500',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  Hired: {
    name: 'Hired',
    label: 'Hired',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accentBorder: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  Rejected: {
    name: 'Rejected',
    label: 'Rejected',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    accentBorder: 'border-l-rose-500',
    iconBg: 'bg-rose-50 text-rose-600',
  },
};

export function getStageConfig(stage: string): StageConfig {
  return STAGE_CONFIGS[stage as Stage] || STAGE_CONFIGS.Applied;
}

/**
 * Generate consistent user avatar initials and background color
 */
export function getAvatarDetails(name: string): { initials: string; bg: string; text: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  let initials: string;
  if (parts.length === 0) {
    initials = '?';
  } else if (parts.length === 1) {
    initials = parts[0].slice(0, 2).toUpperCase();
  } else {
    initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  // Consistent color palette
  const colors = [
    { bg: 'bg-slate-100', text: 'text-slate-700' },
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    { bg: 'bg-violet-100', text: 'text-violet-700' },
    { bg: 'bg-amber-100', text: 'text-amber-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    { bg: 'bg-teal-100', text: 'text-teal-700' },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % colors.length;

  return {
    initials,
    ...colors[colorIndex],
  };
}
