"use server";
import {revalidatePath} from "next/cache";
import {requireRole} from "@/lib/auth/session";
import {answerSchema,completionSchema} from "@/server/content/schemas";
import {completeLesson,scoreMultipleChoice} from "@/server/content/lesson-service";
export async function answerLessonQuestionAction(input:unknown){const user=await requireRole(["student"]);const parsed=answerSchema.safeParse(input);if(!parsed.success)return{ok:false,error:"INVALID_INPUT"};try{return{ok:true,...await scoreMultipleChoice(user.id,parsed.data)}}catch{return{ok:false,error:"ANSWER_FAILED"}}}
export async function completeLessonAction(input:unknown){const user=await requireRole(["student"]);const parsed=completionSchema.safeParse(input);if(!parsed.success)return{ok:false,error:"INVALID_INPUT"};try{const result=await completeLesson(user.id,parsed.data.lessonId);revalidatePath("/learn","layout");return{ok:true,...result}}catch(error){return{ok:false,error:error instanceof Error&&error.message==="REQUIRED_QUESTION_INCOMPLETE"?"QUESTION_REQUIRED":"COMPLETE_FAILED"}}}

