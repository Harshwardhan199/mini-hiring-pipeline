import { useState, useEffect, useRef, useCallback } from 'react';
import type { FormEvent } from 'react';
import { candidateService } from '../../services/candidate.service.ts';
import type { Candidate } from '../../types/candidate.types.ts';
import { CloseIcon, SpinnerIcon, AlertCircleIcon, UserIcon, MailIcon } from '../common/Icons.tsx';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCandidateAdded: (newCandidate: Candidate) => void;
}

export function AddCandidateModal({ isOpen, onClose, onCandidateAdded }: AddCandidateModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset form and close
  const handleClose = useCallback(() => {
    setName('');
    setEmail('');
    setErrors({});
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  // Focus input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, handleClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Candidate name is required';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const created = await candidateService.createCandidate({
        name: name.trim(),
        email: email.trim(),
      });
      onCandidateAdded(created);
      handleClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrors({
        general: error?.message || 'Failed to create candidate. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={() => {
          if (!isSubmitting) handleClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 z-10 transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 id="modal-headline" className="text-base font-semibold text-slate-900">
              Add New Candidate
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate will enter the pipeline in <strong>Applied</strong> stage.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Close dialog"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* General API error */}
          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircleIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="candidate-name" className="block text-xs font-medium text-slate-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                ref={nameInputRef}
                id="candidate-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                disabled={isSubmitting}
                placeholder="e.g. Priya Sharma"
                className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-400'
                    : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-400'
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="candidate-email" className="block text-xs font-medium text-slate-700 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                <MailIcon className="w-4 h-4" />
              </div>
              <input
                id="candidate-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                disabled={isSubmitting}
                placeholder="e.g. priya@example.com"
                className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-400'
                    : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-400'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-xl transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              {isSubmitting ? (
                <>
                  <SpinnerIcon className="w-3.5 h-3.5 text-white" />
                  <span>Adding candidate...</span>
                </>
              ) : (
                <span>Add candidate</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
