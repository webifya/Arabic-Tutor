import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool, withTransaction } from "@/lib/db/mysql";
import { createId } from "@/lib/auth/user-repository";
import { calculateStreak, isDuplicateXpError, localDateKey, progressPercent, recommendStartingPoint, type OnboardingInput } from "./validation";

const INITIAL_COURSE_SLUG="arabic-foundation-bn";
export type LearnerProfile={id:string;fullName:string;displayName:string|null;email:string;avatarPath:string|null;role:string;interfaceLocale:"bn"|"en";studentMode:"standard"|"child";onboardingState:string;arabicLevel:string|null;recommendedStartingPoint:string|null;learningGoal:string|null;dailyGoalMinutes:number;country:string|null;timezone:string;nativeLanguageCode:string;learningLanguageCode:string};

export async function getLearnerProfile(userId:string):Promise<LearnerProfile|null>{
  const[rows]=await(await getPool()).execute<RowDataPacket[]>(`SELECT u.id,u.full_name fullName,u.display_name displayName,u.email,u.avatar_path avatarPath,u.role,u.interface_locale interfaceLocale,u.student_mode studentMode,u.onboarding_state onboardingState,u.arabic_level arabicLevel,u.recommended_starting_point recommendedStartingPoint,u.learning_goal learningGoal,u.daily_goal_minutes dailyGoalMinutes,u.country,u.timezone,n.code nativeLanguageCode,l.code learningLanguageCode FROM users u LEFT JOIN languages n ON n.id=u.native_language_id LEFT JOIN languages l ON l.id=u.learning_language_id WHERE u.id=? AND u.status='active' LIMIT 1`,[userId]);
  return (rows[0] as LearnerProfile|undefined)??null;
}

export async function completeOnboarding(userId:string,input:OnboardingInput):Promise<string>{
  const startingPoint=recommendStartingPoint(input.arabicLevel);
  return withTransaction(async(connection)=>{
    const[result]=await connection.execute<ResultSetHeader>(`UPDATE users SET arabic_level=?,learning_goal=?,daily_goal_minutes=?,student_mode=?,recommended_starting_point=?,onboarding_state='completed',onboarding_completed_at=COALESCE(onboarding_completed_at,NOW(3)) WHERE id=? AND role='student' AND status='active'`,[input.arabicLevel,input.learningGoal,input.dailyGoalMinutes,input.studentMode,startingPoint,userId]);
    if(result.affectedRows!==1)throw new Error("ONBOARDING_NOT_AUTHORIZED");
    const[courses]=await connection.execute<RowDataPacket[]>("SELECT id FROM courses WHERE slug=? LIMIT 1",[INITIAL_COURSE_SLUG]);
    if(!courses[0])throw new Error("INITIAL_COURSE_MISSING");
    await connection.execute("INSERT IGNORE INTO course_enrollments (id,user_id,course_id,status) VALUES (?,?,?,'active')",[createId(),userId,courses[0].id]);
    return startingPoint;
  });
}

export async function ensureInitialEnrollment(userId:string):Promise<void>{
  await withTransaction(async(connection)=>{const[courses]=await connection.execute<RowDataPacket[]>("SELECT id FROM courses WHERE slug=? LIMIT 1",[INITIAL_COURSE_SLUG]);if(courses[0])await connection.execute("INSERT IGNORE INTO course_enrollments (id,user_id,course_id,status) VALUES (?,?,?,'active')",[createId(),userId,courses[0].id]);});
}

export type DashboardData={profile:LearnerProfile;course:null|{slug:string;name:string;description:string|null;currentLessonTitle:string|null;currentUnitName:string|null;currentLevelName:string|null;totalLessons:number;completedLessons:number;progress:number};minutesToday:number;streak:number;xp:number;wordsLearned:number;reviewsDue:number;recentAchievement:null};
export async function getDashboardData(userId:string,now=new Date()):Promise<DashboardData>{
  const profile=await getLearnerProfile(userId);if(!profile)throw new Error("LEARNER_NOT_FOUND");
  const pool=await getPool();const today=localDateKey(now,profile.timezone);
  const[enrollments]=await pool.execute<RowDataPacket[]>(`SELECT c.slug,c.name,c.description,l.title currentLessonTitle,cu.name currentUnitName,cl.name currentLevelName,(SELECT COUNT(*) FROM lessons ls JOIN course_units u ON u.id=ls.unit_id JOIN course_levels lv ON lv.id=u.level_id WHERE lv.course_id=c.id AND ls.status='published') totalLessons,(SELECT COUNT(*) FROM lesson_progress lp JOIN lessons ls ON ls.id=lp.lesson_id JOIN course_units u ON u.id=ls.unit_id JOIN course_levels lv ON lv.id=u.level_id WHERE lp.user_id=? AND lp.status='completed' AND lv.course_id=c.id) completedLessons FROM course_enrollments e JOIN courses c ON c.id=e.course_id LEFT JOIN lessons l ON l.id=e.current_lesson_id AND l.status='published' LEFT JOIN course_units cu ON cu.id=l.unit_id LEFT JOIN course_levels cl ON cl.id=cu.level_id WHERE e.user_id=? AND e.status='active' ORDER BY e.started_at LIMIT 1`,[userId,userId]);
  const[activity]=await pool.execute<RowDataPacket[]>("SELECT activity_date activityDate,minutes,words_learned wordsLearned FROM daily_learning_activities WHERE user_id=? AND activity_date>=DATE_SUB(?,INTERVAL 370 DAY) ORDER BY activity_date DESC",[userId,today]);
  const[activityTotals]=await pool.execute<RowDataPacket[]>("SELECT COALESCE(SUM(words_learned),0) wordsLearned FROM daily_learning_activities WHERE user_id=?",[userId]);
  const[xpRows]=await pool.execute<RowDataPacket[]>("SELECT COALESCE(SUM(amount),0) xp FROM xp_transactions WHERE user_id=?",[userId]);
  const dates=activity.filter(row=>Number(row.minutes)>0||Number(row.wordsLearned)>0).map(row=>String(row.activityDate).slice(0,10));
  const todayRow=activity.find(row=>String(row.activityDate).slice(0,10)===today);
  const enrollment=enrollments[0];const total=Number(enrollment?.totalLessons??0),completed=Number(enrollment?.completedLessons??0);
  return {profile,course:enrollment?{slug:String(enrollment.slug),name:String(enrollment.name),description:enrollment.description?String(enrollment.description):null,currentLessonTitle:enrollment.currentLessonTitle?String(enrollment.currentLessonTitle):null,currentUnitName:enrollment.currentUnitName?String(enrollment.currentUnitName):null,currentLevelName:enrollment.currentLevelName?String(enrollment.currentLevelName):null,totalLessons:total,completedLessons:completed,progress:progressPercent(completed,total)}:null,minutesToday:Number(todayRow?.minutes??0),streak:calculateStreak(dates,today),xp:Number(xpRows[0]?.xp??0),wordsLearned:Number(activityTotals[0]?.wordsLearned??0),reviewsDue:0,recentAchievement:null};
}

export async function awardXp(input:{userId:string;amount:number;reason:string;sourceType:string;sourceId:string}):Promise<boolean>{
  if(!Number.isInteger(input.amount)||input.amount===0||Math.abs(input.amount)>10000)throw new Error("INVALID_XP_AWARD");
  try{await(await getPool()).execute("INSERT INTO xp_transactions (id,user_id,amount,reason,source_type,source_id) VALUES (?,?,?,?,?,?)",[createId(),input.userId,input.amount,input.reason,input.sourceType,input.sourceId]);return true;}catch(error){if(isDuplicateXpError(error))return false;throw error;}
}

export async function recordLearningActivity(input:{userId:string;occurredAt:Date;timezone:string;minutes:number;lessonsCompleted:number;wordsLearned:number}):Promise<void>{
  const date=localDateKey(input.occurredAt,input.timezone);if(![input.minutes,input.lessonsCompleted,input.wordsLearned].every(value=>Number.isInteger(value)&&value>=0))throw new Error("INVALID_ACTIVITY");
  await(await getPool()).execute(`INSERT INTO daily_learning_activities (id,user_id,activity_date,timezone,minutes,lessons_completed,words_learned) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE minutes=minutes+VALUES(minutes),lessons_completed=lessons_completed+VALUES(lessons_completed),words_learned=words_learned+VALUES(words_learned),timezone=VALUES(timezone)`,[createId(),input.userId,date,input.timezone,input.minutes,input.lessonsCompleted,input.wordsLearned]);
}

export type CourseOverview={slug:string;name:string;description:string|null;status:string;source:{code:string;name:string;nativeName:string;direction:string};target:{code:string;name:string;nativeName:string;direction:string};currentLessonId:string|null;levels:Array<{id:string;name:string;position:number;units:Array<{id:string;name:string;position:number;lessons:Array<{id:string;title:string;position:number;state:"completed"|"current"|"available"|"locked"}>}>}>};
export async function getCourseOverview(userId:string,slug:string):Promise<CourseOverview|null>{
  const pool=await getPool();const[courseRows]=await pool.execute<RowDataPacket[]>(`SELECT c.id,c.slug,c.name,c.description,c.status,s.code sourceCode,s.name sourceName,s.native_name sourceNativeName,s.direction sourceDirection,t.code targetCode,t.name targetName,t.native_name targetNativeName,t.direction targetDirection,e.current_lesson_id currentLessonId FROM courses c JOIN languages s ON s.id=c.source_language_id JOIN languages t ON t.id=c.target_language_id JOIN course_enrollments e ON e.course_id=c.id AND e.user_id=? AND e.status='active' WHERE c.slug=? LIMIT 1`,[userId,slug]);const course=courseRows[0];if(!course)return null;
  const[rows]=await pool.execute<RowDataPacket[]>(`SELECT lv.id levelId,lv.name levelName,lv.position levelPosition,u.id unitId,u.name unitName,u.position unitPosition,l.id lessonId,l.title lessonTitle,l.position lessonPosition,COALESCE(lp.status,'not_started') progressStatus FROM course_levels lv LEFT JOIN course_units u ON u.level_id=lv.id AND u.status='published' LEFT JOIN lessons l ON l.unit_id=u.id AND l.status='published' LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=? WHERE lv.course_id=? AND lv.status='published' ORDER BY lv.position,u.position,l.position`,[userId,course.id]);
  const levels:CourseOverview["levels"]=[];let firstAvailableAssigned=false;for(const row of rows){let level=levels.find(item=>item.id===row.levelId);if(!level){level={id:String(row.levelId),name:String(row.levelName),position:Number(row.levelPosition),units:[]};levels.push(level);}if(!row.unitId)continue;let unit=level.units.find(item=>item.id===row.unitId);if(!unit){unit={id:String(row.unitId),name:String(row.unitName),position:Number(row.unitPosition),lessons:[]};level.units.push(unit);}if(row.lessonId){let state:"completed"|"current"|"available"|"locked"="locked";if(row.progressStatus==="completed")state="completed";else if(row.lessonId===course.currentLessonId)state="current";else if(!course.currentLessonId&&!firstAvailableAssigned){state="available";firstAvailableAssigned=true;}unit.lessons.push({id:String(row.lessonId),title:String(row.lessonTitle),position:Number(row.lessonPosition),state});}}
  return {slug:String(course.slug),name:String(course.name),description:course.description?String(course.description):null,status:String(course.status),source:{code:String(course.sourceCode),name:String(course.sourceName),nativeName:String(course.sourceNativeName),direction:String(course.sourceDirection)},target:{code:String(course.targetCode),name:String(course.targetName),nativeName:String(course.targetNativeName),direction:String(course.targetDirection)},currentLessonId:course.currentLessonId?String(course.currentLessonId):null,levels};
}

export async function listEnabledLanguages(){const[rows]=await(await getPool()).execute<RowDataPacket[]>("SELECT code,name,native_name nativeName,direction FROM languages WHERE enabled=true ORDER BY name");return rows.map(row=>({code:String(row.code),name:String(row.name),nativeName:String(row.nativeName),direction:String(row.direction)}));}
export async function updateLearnerProfile(userId:string,input:{fullName:string;displayName?:string;nativeLanguageCode:string;learningLanguageCode:string;country:string;timezone:string;learningGoal:string;dailyGoalMinutes:number}){const pool=await getPool();const[languages]=await pool.execute<RowDataPacket[]>("SELECT id,code FROM languages WHERE enabled=true AND code IN (?,?)",[input.nativeLanguageCode,input.learningLanguageCode]);const ids=new Map(languages.map(row=>[String(row.code),String(row.id)]));if(!ids.get(input.nativeLanguageCode)||!ids.get(input.learningLanguageCode))throw new Error("LANGUAGE_NOT_AVAILABLE");const[result]=await pool.execute<ResultSetHeader>(`UPDATE users SET full_name=?,display_name=?,native_language_id=?,learning_language_id=?,country=?,timezone=?,learning_goal=?,daily_goal_minutes=? WHERE id=? AND role='student' AND status='active'`,[input.fullName,input.displayName||null,ids.get(input.nativeLanguageCode),ids.get(input.learningLanguageCode),input.country,input.timezone,input.learningGoal,input.dailyGoalMinutes,userId]);if(result.affectedRows!==1)throw new Error("PROFILE_NOT_AUTHORIZED");}
export async function updateLearnerSettings(userId:string,input:{interfaceLocale:"bn"|"en";studentMode:"standard"|"child";dailyGoalMinutes:number}){const[result]=await(await getPool()).execute<ResultSetHeader>("UPDATE users SET interface_locale=?,student_mode=?,daily_goal_minutes=? WHERE id=? AND role='student' AND status='active'",[input.interfaceLocale,input.studentMode,input.dailyGoalMinutes,userId]);if(result.affectedRows!==1)throw new Error("SETTINGS_NOT_AUTHORIZED");}
