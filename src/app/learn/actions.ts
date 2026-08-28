"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { completeOnboarding, updateLearnerProfile, updateLearnerSettings } from "@/server/learner/service";
import { onboardingSchema, profileSchema, settingsSchema } from "@/server/learner/validation";

export type LearnerActionResult={ok:boolean;message?:string;startingPoint?:string;fields?:Record<string,string[]>};
const failure=(error:{flatten():{fieldErrors:Record<string,string[]>}}):LearnerActionResult=>({ok:false,message:"INVALID_INPUT",fields:error.flatten().fieldErrors});

export async function completeOnboardingAction(input:unknown):Promise<LearnerActionResult>{const user=await requireRole(["student"]);const parsed=onboardingSchema.safeParse(input);if(!parsed.success)return failure(parsed.error);try{const startingPoint=await completeOnboarding(user.id,parsed.data);revalidatePath("/learn","layout");return{ok:true,startingPoint};}catch{return{ok:false,message:"SAVE_FAILED"}}}
export async function updateProfileAction(input:unknown):Promise<LearnerActionResult>{const user=await requireRole(["student"]);const parsed=profileSchema.safeParse(input);if(!parsed.success)return failure(parsed.error);try{await updateLearnerProfile(user.id,{...parsed.data,displayName:parsed.data.displayName||undefined});revalidatePath("/profile");revalidatePath("/learn","layout");return{ok:true};}catch{return{ok:false,message:"SAVE_FAILED"}}}
export async function updateSettingsAction(input:unknown):Promise<LearnerActionResult>{const user=await requireRole(["student"]);const parsed=settingsSchema.safeParse(input);if(!parsed.success)return failure(parsed.error);try{await updateLearnerSettings(user.id,parsed.data);revalidatePath("/settings");revalidatePath("/learn","layout");return{ok:true};}catch{return{ok:false,message:"SAVE_FAILED"}}}
