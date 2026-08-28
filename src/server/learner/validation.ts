import { z } from "zod";

export const arabicLevels = ["complete_beginner","knows_some_letters","reads_slowly","basic","intermediate"] as const;
export const learningGoals = ["quranic","conversation","travel","work","school","general"] as const;
export const dailyGoals = [5,10,15,20,30] as const;
export const studentModes = ["standard","child"] as const;

export const onboardingSchema = z.object({
  arabicLevel: z.enum(arabicLevels), learningGoal: z.enum(learningGoals),
  dailyGoalMinutes: z.number().int().refine((value): value is (typeof dailyGoals)[number] => dailyGoals.includes(value as never)),
  studentMode: z.enum(studentModes),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(191), displayName: z.string().trim().max(100).optional(),
  nativeLanguageCode: z.string().trim().min(2).max(16), learningLanguageCode: z.string().trim().min(2).max(16),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  timezone: z.string().min(1).max(100).refine((value) => { try { new Intl.DateTimeFormat("en",{timeZone:value}); return true; } catch { return false; } }),
  learningGoal: z.enum(learningGoals), dailyGoalMinutes: z.number().int().refine((value) => dailyGoals.includes(value as never)),
});
export const settingsSchema = z.object({ interfaceLocale: z.enum(["bn","en"]), studentMode: z.enum(studentModes), dailyGoalMinutes: z.number().int().refine((value) => dailyGoals.includes(value as never)) });

export type StartingPoint = "arabic_alphabet"|"letter_review"|"reading_basics"|"basic_foundations"|"intermediate_review";
export function recommendStartingPoint(level: OnboardingInput["arabicLevel"]): StartingPoint {
  return { complete_beginner:"arabic_alphabet", knows_some_letters:"letter_review", reads_slowly:"reading_basics", basic:"basic_foundations", intermediate:"intermediate_review" }[level] as StartingPoint;
}

export function localDateKey(date: Date, timezone: string): string {
  const parts=new Intl.DateTimeFormat("en",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const value=(type:string)=>parts.find(part=>part.type===type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function calculateStreak(activityDates: readonly string[], todayKey: string): number {
  const active=new Set(activityDates); const cursor=new Date(`${todayKey}T12:00:00Z`); let streak=0;
  if (!active.has(todayKey)) cursor.setUTCDate(cursor.getUTCDate()-1);
  while (active.has(cursor.toISOString().slice(0,10))) { streak++; cursor.setUTCDate(cursor.getUTCDate()-1); }
  return streak;
}

export function progressPercent(completed:number,total:number):number{return total>0?Math.min(100,Math.max(0,Math.round(completed/total*100))):0;}
export function isDuplicateXpError(error:unknown):boolean{return (error as{code?:string})?.code==="ER_DUP_ENTRY";}
