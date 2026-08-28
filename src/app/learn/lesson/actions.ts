"use server";
import {revalidatePath} from "next/cache";
import {requireRole} from "@/lib/auth/session";
import {completionSchema} from "@/server/content/schemas";
import {completeLesson} from "@/server/content/lesson-service";
import {submissionSchema} from "@/server/exercises/contracts";import {submitExercise} from "@/server/exercises/service";import {consumeRateLimit,rateLimitKey} from "@/lib/auth/rate-limit";
export async function submitExerciseAction(input:unknown){const user=await requireRole(["student"]);const parsed=submissionSchema.safeParse(input);if(!parsed.success)return{ok:false,error:"INVALID_INPUT"};if(!(await consumeRateLimit(rateLimitKey("exercise",user.id),120,10*60_000)))return{ok:false,error:"RATE_LIMITED"};try{return{ok:true,...await submitExercise(user.id,parsed.data)}}catch(error){const message=error instanceof Error?error.message:"";return{ok:false,error:message==="RETRY_LIMIT"?"RETRY_LIMIT":message==="EXERCISE_UNAVAILABLE"?"UNAVAILABLE":"SUBMIT_FAILED"}}}
export async function completeLessonAction(input:unknown){const user=await requireRole(["student"]);const parsed=completionSchema.safeParse(input);if(!parsed.success)return{ok:false,error:"INVALID_INPUT"};try{const result=await completeLesson(user.id,parsed.data.lessonId);revalidatePath("/learn","layout");return{ok:true,...result}}catch(error){const message=error instanceof Error?error.message:"";return{ok:false,error:message.startsWith("REQUIRED_EXERCISE")||message==="MINIMUM_SCORE_NOT_MET"?"EXERCISE_REQUIRED":"COMPLETE_FAILED"}}}
