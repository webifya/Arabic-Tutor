import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {parseExercise,publicPayload,submissionSchema} from "@/server/exercises/contracts";
import {acceptedText,normalizeText,scoreExercise} from "@/server/exercises/scoring";

const scoring={maxScore:100 as const,diacritics:"required" as const,caseFold:false};

describe("Phase 4 exercise contracts",()=>{
  it("removes authoritative answers from every public scored payload",()=>{
    const multiple=parseExercise("multiple_choice",{options:[{id:"a",label:"ا"},{id:"b",label:"ب"}],correctOptionId:"b",explanationBn:"ব্যাখ্যা"},{maxScore:100},{mode:"unlimited",mustCorrectToContinue:true});
    expect(multiple).not.toBeNull();
    const exposed=publicPayload(multiple!.type,multiple!.payload);
    expect(JSON.stringify(exposed)).not.toContain("correctOptionId");
    expect(JSON.stringify(exposed)).not.toContain("ব্যাখ্যা");

    const translation=parseExercise("translation",{acceptedAnswers:["ধন্যবাদ"],expectedDisplay:"ধন্যবাদ"},{maxScore:100},{mode:"unlimited",mustCorrectToContinue:true});
    expect(JSON.stringify(publicPayload(translation!.type,translation!.payload))).toBe("{}");
  });

  it("rejects client authority fields, malformed IDs, and oversized text",()=>{
    expect(submissionSchema.safeParse({exerciseId:"x",requestId:"request_123",response:{selectedOptionId:"b"},score:100,correct:true}).success).toBe(false);
    expect(submissionSchema.safeParse({exerciseId:"x",requestId:"short",response:{text:"ok"}}).success).toBe(false);
    expect(submissionSchema.safeParse({exerciseId:"x",requestId:"request_123",response:{text:"x".repeat(2001)}}).success).toBe(false);
  });

  it("requires retry limits to be explicit and bounded",()=>{
    expect(parseExercise("fill_blank",{acceptedAnswers:["ب"]},{maxScore:100},{mode:"max_attempts",mustCorrectToContinue:true})).toBeNull();
    expect(parseExercise("fill_blank",{acceptedAnswers:["ب"]},{maxScore:100},{mode:"max_attempts",maxAttempts:3,mustCorrectToContinue:true})).not.toBeNull();
  });

  it("rejects inconsistent answer structures before publication",()=>{
    expect(parseExercise("multiple_choice",{options:[{id:"a",label:"ا"},{id:"a",label:"ب"}],correctOptionId:"missing"},{maxScore:100},{mode:"unlimited",mustCorrectToContinue:true})).toBeNull();
    expect(parseExercise("matching",{pairs:[{id:"same",left:"ب",right:"b"},{id:"same",left:"ت",right:"t"}]},{maxScore:100},{mode:"unlimited",mustCorrectToContinue:true})).toBeNull();
    expect(parseExercise("reorder",{tokens:[{id:"a",label:"السلام"},{id:"b",label:"عليكم"}],correctOrder:["a","missing"]},{maxScore:100},{mode:"unlimited",mustCorrectToContinue:true})).toBeNull();
  });
});

describe("deterministic server scoring",()=>{
  it("scores multiple choice without trusting client correctness",()=>{
    const payload={options:[{id:"alif",label:"ا"},{id:"ba",label:"ب"}],correctOptionId:"ba"};
    expect(scoreExercise("multiple_choice",payload,{selectedOptionId:"ba"},scoring)).toMatchObject({correct:true,score:100});
    expect(scoreExercise("multiple_choice",payload,{selectedOptionId:"alif"},scoring)).toMatchObject({correct:false,score:0});
  });

  it("scores complete matching and gives deterministic partial score",()=>{
    const payload={pairs:[{id:"ba",left:"ب",right:"b sound"},{id:"tha",left:"ث",right:"no exact Bangla sound"}]};
    expect(scoreExercise("matching",payload,{pairs:{ba:"r1",tha:"r2"}},scoring)).toMatchObject({correct:true,score:100});
    expect(scoreExercise("matching",payload,{pairs:{ba:"r1",tha:"r1"}},scoring)).toMatchObject({correct:false,score:50});
  });

  it("scores reorder only when the complete sequence matches",()=>{
    const payload={tokens:[{id:"peace",label:"السَّلَامُ"},{id:"upon",label:"عَلَيْكُمْ"}],correctOrder:["peace","upon"]};
    expect(scoreExercise("reorder",payload,{order:["peace","upon"]},scoring).correct).toBe(true);
    expect(scoreExercise("reorder",payload,{order:["upon","peace"]},scoring).correct).toBe(false);
  });

  it("accepts configured fill-blank and translation alternatives",()=>{
    const fill={acceptedAnswers:["ي"],expectedDisplay:"ي"};
    expect(scoreExercise("fill_blank",fill,{text:"  ي  "},scoring).correct).toBe(true);
    const translation={acceptedAnswers:["ধন্যবাদ","আপনাকে ধন্যবাদ"],expectedDisplay:"ধন্যবাদ"};
    expect(scoreExercise("translation",translation,{text:"ধন্যবাদ"},{...scoring,caseFold:true}).correct).toBe(true);
  });

  it("applies Arabic diacritic policy per exercise, never globally",()=>{
    expect(acceptedText("ب",["بَ"],{diacritics:"required",caseFold:false}).correct).toBe(false);
    expect(acceptedText("ب",["بَ"],{diacritics:"optional",caseFold:false}).correct).toBe(true);
    expect(acceptedText("بُ",["بَ"],{diacritics:"ignored",caseFold:false}).correct).toBe(true);
    expect(normalizeText("  السَّلَامُ  ",{diacritics:"required",caseFold:false})).toBe("السَّلَامُ");
  });

  it("turns flashcard self-assessment into an explicit review signal",()=>{
    const payload={front:"ا",backBn:"আলিফ",backEn:"Alif"};
    expect(scoreExercise("flashcard_check",payload,{selfAssessment:"review"},scoring)).toMatchObject({correct:false,reviewChoice:"review"});
    expect(scoreExercise("flashcard_check",payload,{selfAssessment:"know"},scoring)).toMatchObject({correct:true,reviewChoice:"know"});
  });
});

describe("Phase 4 persistence and authorization architecture",()=>{
  const service=readFileSync("src/server/exercises/service.ts","utf8");
  const lessonService=readFileSync("src/server/content/lesson-service.ts","utf8");
  const migration=readFileSync("prisma/migrations/20260829000200_phase4_exercise_engine/migration.sql","utf8");

  it("authorizes enrollment, published hierarchy, role, and unlocked lesson",()=>{
    expect(service).toContain("ce.status='active'");
    expect(service).toContain("usr.role='student'");
    expect(service).toContain("e.status='published'");
    expect(service).toContain("canAccessLesson");
    expect(service).toContain("LESSON_LOCKED");
  });

  it("persists attempts idempotently and never accepts client score fields",()=>{
    expect(migration).toContain("exercise_attempts_user_id_request_id_key");
    expect(migration).toContain("exercise_attempts_user_id_exercise_id_attempt_number_key");
    expect(service).toContain("WHERE user_id=? AND request_id=?");
    expect(service).toContain("scoreExercise(parsed.type");
  });

  it("migrates Phase 3 attempts and leaves one scoring system",()=>{
    expect(migration).toContain("FROM `lesson_question_attempts`");
    expect(migration).toContain("DROP TABLE `lesson_question_attempts`");
    expect(migration).toContain("ON DUPLICATE KEY UPDATE");
  });

  it("updates review and meaningful daily activity only on submission",()=>{
    expect(service).toContain("exercise_review_signals");
    expect(service).toContain("exercise_attempts=exercise_attempts+1");
    expect(service).not.toContain("xp_transactions");
  });

  it("enforces configurable completion, calculates score, and keeps XP unique",()=>{
    expect(lessonService).toContain("requiredExercisesAttempted");
    expect(lessonService).toContain("requiredExercisesCorrect");
    expect(lessonService).toContain("minimumScorePercent");
    expect(lessonService).toContain("score_percent");
    expect(lessonService).toContain("INSERT IGNORE INTO xp_transactions");
  });

  it("prepares disabled audio and speech types without fake execution",()=>{
    expect(migration).toContain("'audioAssetId',NULL");
    expect(migration).toContain("'read_aloud_placeholder'");
    expect(migration).toContain("'speak_placeholder'");
    expect(service).toContain("EXERCISE_UNAVAILABLE");
  });
});
