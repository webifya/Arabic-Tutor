import { z } from "zod";
import {exerciseReferenceSchema} from "@/server/exercises/contracts";

const text = z.string().trim().min(1).max(4000);
const key = z.string().regex(/^[a-z0-9-]+$/).max(100);
const base = { schemaVersion: z.literal(1).default(1) };

export const arabicLetterSchema = z.object({
  stableKey:key,character:text.max(8),arabicName:text.max(64),banglaPronunciation:text.max(191),englishTransliteration:text.max(64).nullable(),
  banglaSoundExplanation:text,isolatedForm:text.max(16),initialForm:text.max(16).nullable(),medialForm:text.max(16).nullable(),finalForm:text.max(16).nullable(),
  makhrajRegion:z.enum(["throat","tongue","lips","nasal","oral_cavity"]),makhrajSubregion:text.max(100).nullable(),makhrajExplanationBangla:text,pronunciationTipBangla:text,position:z.number().int().positive(),
});
export type ArabicLetterContent=z.infer<typeof arabicLetterSchema>;

export const vocabularySchema=z.object({stableKey:key,word:text.max(191),wordWithDiacritics:text.max(191).nullable(),banglaPronunciation:text.max(191).nullable(),banglaMeaning:text.max(500),englishMeaning:text.max(500).nullable(),transliteration:text.max(191).nullable(),partOfSpeech:text.max(64).nullable(),root:text.max(32).nullable(),difficulty:z.number().int().min(1).max(5),exampleSentence:text.nullable()});
export const phraseSchema=z.object({stableKey:key,text:text.max(500),textWithDiacritics:text.max(500).nullable(),banglaPronunciation:text.max(500).nullable(),banglaMeaning:text.max(500),englishMeaning:text.max(500).nullable(),usageNoteBangla:text.nullable(),difficulty:z.number().int().min(1).max(5)});
export type VocabularyContent=z.infer<typeof vocabularySchema>;export type PhraseContent=z.infer<typeof phraseSchema>;

const payloadSchemas={
  heading:z.object({...base,text:text.max(500)}),explanation:z.object({...base,body:text}),
  arabic_text:z.object({...base,text:text.max(1000).optional(),size:z.enum(["md","lg","xl","hero"]).default("xl"),label:text.max(500).optional(),letterKey:key.optional(),exampleWordKey:key.optional()}).refine(value=>Boolean(value.text||value.letterKey),"Arabic text or letter key is required"),
  vocabulary:z.object({...base,vocabularyKeys:z.array(key).min(1).max(20)}),phrase:z.object({...base,phraseKeys:z.array(key).min(1).max(20)}),
  example:z.object({...base,arabic:text.max(1000),bangla:text.max(1000),transliteration:text.max(500).optional()}),
  tip:z.object({...base,title:text.max(200),body:text}),audio_placeholder:z.object({...base,label:text.max(300)}),pronunciation_placeholder:z.object({...base,label:text.max(300)}),
  exercise:exerciseReferenceSchema,continue:z.object({...base,label:text.max(200)}),
} as const;
export const supportedBlockTypes=Object.keys(payloadSchemas) as Array<keyof typeof payloadSchemas>;
export type SupportedBlockType=keyof typeof payloadSchemas;
export function parseLessonBlock(type:string,payload:unknown){if(!(type in payloadSchemas))return null;const result=payloadSchemas[type as SupportedBlockType].safeParse(payload);return result.success?{type:type as SupportedBlockType,payload:result.data}:null;}
export const completionSchema=z.object({lessonId:z.string().min(1).max(32)});
