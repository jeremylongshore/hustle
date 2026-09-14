'use client';

import { useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Camera, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { POSITIONS, LEAGUES } from '@/lib/constants';
import { getInitials, getAvatarColor } from '@/lib/player-utils';
import { cn } from '@/lib/utils';
import { isPastOrTodayDate } from '@/lib/validations/athlete-date';

// ─── Schema ───────────────────────────────────────────────────
export const athleteSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required').refine(isPastOrTodayDate, 'Date of birth must be a valid date and cannot be in the future'),
  gender: z.enum(['male', 'female', 'other']),
  position: z.string().min(1, 'Position is required'),
  teamName: z.string().optional(),
  league: z.string().optional(),
  jerseyNumber: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(1).max(99).optional()
  ),
});

// Zod v4: preprocess fields typed as unknown; define manually
export type AthleteFormValues = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  position: string;
  teamName?: string;
  league?: string;
  jerseyNumber?: number;
};

// ─── Field components ─────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="font-body text-xs text-red-500 mt-1"
    >
      {msg}
    </motion.p>
  );
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-zinc-400 transition-colors';

const selectCls =
  'w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors appearance-none';

// ─── Form Component ──────────────────────────────────────────
interface AthleteFormProps {
  defaultValues?: Partial<AthleteFormValues>;
  onSubmit: (data: AthleteFormValues, photoFile?: File) => Promise<void>;
  mode: 'add' | 'edit';
  backHref?: string;
}

export function AthleteForm({
  defaultValues,
  onSubmit,
  mode,
  backHref = '/dashboard/athletes',
}: AthleteFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AthleteFormValues>({
    resolver: zodResolver(athleteSchema) as Resolver<AthleteFormValues>,
    defaultValues: {
      gender: 'male',
      ...defaultValues,
    },
  });

  const firstName = watch('firstName') ?? '';
  const lastName = watch('lastName') ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Athlete';

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleFormSubmit = async (data: AthleteFormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(data, photoFile ?? undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
        {/* Back + title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 font-body text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
          >
            <ChevronLeft size={15} />
            Back
          </Link>
          <h2 className="font-display text-2xl font-semibold text-zinc-900">
            {mode === 'add' ? 'Add Athlete' : 'Edit Athlete'}
          </h2>
          <p className="font-body text-sm text-zinc-500 mt-0.5">
            {mode === 'add'
              ? 'Fill in your athlete\'s details to start tracking.'
              : 'Update the athlete\'s profile information.'}
          </p>
        </motion.div>

        {/* Photo upload */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <p className="font-display text-sm font-semibold text-zinc-700 mb-4">
            Profile Photo
          </p>
          <div className="flex items-center gap-4">
            <div className="relative">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div
                  className={cn(
                    'w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display font-semibold text-2xl',
                    getAvatarColor(fullName)
                  )}
                >
                  {getInitials(fullName)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center shadow-sm hover:bg-zinc-700 transition-colors"
              >
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="font-body text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                {photoPreview ? 'Change photo' : 'Upload photo'}
              </button>
              <p className="font-body text-xs text-zinc-400 mt-0.5">
                JPG or PNG, max 5MB
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhoto}
              className="hidden"
            />
          </div>
        </motion.div>

        {/* Personal info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
        >
          <p className="font-display text-sm font-semibold text-zinc-700">
            Personal Info
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                {...register('firstName')}
                className={cn(inputCls, errors.firstName && 'border-red-300 focus:border-red-400')}
                placeholder="Alex"
              />
              <FieldError msg={errors.firstName?.message} />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                {...register('lastName')}
                className={cn(inputCls, errors.lastName && 'border-red-300 focus:border-red-400')}
                placeholder="Smith"
              />
              <FieldError msg={errors.lastName?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                {...register('dateOfBirth')}
                max={new Date().toISOString().slice(0, 10)}
                className={cn(inputCls, errors.dateOfBirth && 'border-red-300')}
              />
              <FieldError msg={errors.dateOfBirth?.message} />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
                Gender <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('gender')}
                  className={cn(selectCls, errors.gender && 'border-red-300')}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronLeft
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-zinc-400 pointer-events-none"
                />
              </div>
              <FieldError msg={errors.gender?.message} />
            </div>
          </div>
        </motion.div>

        {/* Soccer info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.11 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
        >
          <p className="font-display text-sm font-semibold text-zinc-700">
            Soccer Details
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
                Position <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('position')}
                  className={cn(selectCls, errors.position && 'border-red-300')}
                >
                  <option value="">Select position</option>
                  {POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} ({p.value})
                    </option>
                  ))}
                </select>
                <ChevronLeft
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-zinc-400 pointer-events-none"
                />
              </div>
              <FieldError msg={errors.position?.message} />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
                Jersey Number
              </label>
              <input
                type="number"
                {...register('jerseyNumber')}
                className={cn(inputCls)}
                placeholder="9"
                min={1}
                max={99}
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
              Team Name
            </label>
            <input
              {...register('teamName')}
              className={inputCls}
              placeholder="FC Phoenix U15"
            />
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
              League
            </label>
            <div className="relative">
              <select {...register('league')} className={selectCls}>
                <option value="">Select league</option>
                {LEAGUES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronLeft
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-zinc-400 pointer-events-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.14 }}
          className="flex gap-3 pb-8"
        >
          <Link href={backHref} className="flex-1">
            <span className="block text-center py-3 rounded-full border-2 border-zinc-200 font-display font-semibold text-sm text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-colors">
              Cancel
            </span>
          </Link>
          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 rounded-full font-display font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {mode === 'add' ? 'Add Athlete' : 'Save Changes'}
          </motion.button>
        </motion.div>
      </div>
    </form>
  );
}
