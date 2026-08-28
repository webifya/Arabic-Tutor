import {z} from "zod";
const key=z.string().regex(/^[a-zA-Z0-9_-]+$/).max(100),label=z.string().trim().min(1).max(500);
export const exerciseTypes=["multiple_choice","matching","reorder","fill_blank","translation","listen_select","listen_type","flashcard_check","read_aloud_placeholder","speak_placeholder"] as const;
export type ExerciseType=(typeof exerciseTypes)[number];
export const scoringConfigSchema=z.object({maxScore:z.literal(100).default(100),diacritics:z.enum(["required","optional","ignored"]).default("required"),caseFold:z.boolean().default(false)});
export const retryConfigSchema=z.object({mode:z.enum(["unlimited","max_attempts"]),maxAttempts:z.number().int().min(1).max(20).optional(),mustCorrectToContinue:z.boolean().default(false)}).superRefine((v,c)=>{if(v.mode==="max_attempts"&&!v.maxAttempts)c.addIssue({code:"custom",message:"maxAttempts required"});});
const options=z.array(z.object({id:key,label})).min(2).max(12);
const multipleChoicePayload=z.object({options,correctOptionId:key,explanationBn:label.optional(),explanationEn:label.optional()}).superRefine((value,ctx)=>{if(new Set(value.options.map(option=>option.id)).size!==value.options.length)ctx.addIssue({code:"custom",message:"Option IDs must be unique"});if(!value.options.some(option=>option.id===value.correctOptionId))ctx.addIssue({code:"custom",message:"Correct option must exist"});});
const matchingPayload=z.object({pairs:z.array(z.object({id:key,left:label,right:label})).min(2).max(10)}).refine(value=>new Set(value.pairs.map(pair=>pair.id)).size===value.pairs.length,"Pair IDs must be unique");
const reorderPayload=z.object({tokens:z.array(z.object({id:key,label})).min(2).max(16),correctOrder:z.array(key).min(2).max(16)}).superRefine((value,ctx)=>{const tokenIds=value.tokens.map(token=>token.id);if(new Set(tokenIds).size!==tokenIds.length)ctx.addIssue({code:"custom",message:"Token IDs must be unique"});if(value.correctOrder.length!==tokenIds.length||new Set(value.correctOrder).size!==tokenIds.length||value.correctOrder.some(id=>!tokenIds.includes(id)))ctx.addIssue({code:"custom",message:"Correct order must contain every token exactly once"});});
export const privatePayloadSchemas={
  multiple_choice:multipleChoicePayload,
  matching:matchingPayload,
  reorder:reorderPayload,
  fill_blank:z.object({acceptedAnswers:z.array(label).min(1).max(20),expectedDisplay:label.optional()}),
  translation:z.object({acceptedAnswers:z.array(label).min(1).max(20),expectedDisplay:label.optional()}),
  listen_select:z.object({audioAssetId:z.string().max(32).nullable(),options,correctOptionId:key}),
  listen_type:z.object({audioAssetId:z.string().max(32).nullable(),acceptedAnswers:z.array(label).min(1).max(20)}),
  flashcard_check:z.object({front:label,backBn:label,backEn:label}),
  read_aloud_placeholder:z.object({available:z.literal(false)}),speak_placeholder:z.object({available:z.literal(false)}),
} as const;
export const exerciseReferenceSchema=z.object({schemaVersion:z.literal(1).default(1),exerciseKey:z.string().regex(/^[a-z0-9-]+$/).max(100)});
export const responseSchema=z.union([
  z.object({selectedOptionId:key}).strict(),z.object({pairs:z.record(key,key).refine(v=>Object.keys(v).length<=20)}).strict(),
  z.object({order:z.array(key).min(1).max(20)}).strict(),z.object({text:z.string().max(2000)}).strict(),z.object({selfAssessment:z.enum(["know","review"])}).strict(),
]);
export const submissionSchema=z.object({exerciseId:z.string().min(1).max(32),requestId:z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/),response:responseSchema,durationMs:z.number().int().min(0).max(3_600_000).optional()}).strict();
export type ExerciseResponse=z.infer<typeof responseSchema>;
export type PrivatePayload=z.infer<(typeof privatePayloadSchemas)[ExerciseType]>;
export type PublicExercise={id:string;type:ExerciseType;prompt:string;required:boolean;difficulty:number;retry:{mode:"unlimited"|"max_attempts";maxAttempts?:number;mustCorrectToContinue:boolean};payload:unknown;available:boolean;attempts:number;correct:boolean};
export function parseExercise(type:string,payload:unknown,scoring:unknown,retry:unknown){if(!(exerciseTypes as readonly string[]).includes(type))return null;const exerciseType=type as ExerciseType;const parsedPayload=privatePayloadSchemas[exerciseType].safeParse(payload),parsedScoring=scoringConfigSchema.safeParse(scoring),parsedRetry=retryConfigSchema.safeParse(retry);return parsedPayload.success&&parsedScoring.success&&parsedRetry.success?{type:exerciseType,payload:parsedPayload.data,scoring:parsedScoring.data,retry:parsedRetry.data}:null;}
export function publicPayload(type:ExerciseType,payload:PrivatePayload){switch(type){case"multiple_choice":{const p=payload as z.infer<typeof privatePayloadSchemas.multiple_choice>;return{options:p.options};}case"matching":{const p=payload as z.infer<typeof privatePayloadSchemas.matching>;return{leftItems:p.pairs.map(x=>({id:x.id,label:x.left})),rightItems:[...p.pairs].reverse().map((x,i,a)=>({id:`r${a.length-i}`,label:x.right}))};}case"reorder":{const p=payload as z.infer<typeof privatePayloadSchemas.reorder>;return{tokens:[...p.tokens].reverse()};}case"fill_blank":case"translation":return{};case"listen_select":{const p=payload as z.infer<typeof privatePayloadSchemas.listen_select>;return{audioAvailable:Boolean(p.audioAssetId),options:p.options};}case"listen_type":{const p=payload as z.infer<typeof privatePayloadSchemas.listen_type>;return{audioAvailable:Boolean(p.audioAssetId)};}case"flashcard_check":{const p=payload as z.infer<typeof privatePayloadSchemas.flashcard_check>;return{front:p.front,backBn:p.backBn,backEn:p.backEn};}default:return{available:false};}}
