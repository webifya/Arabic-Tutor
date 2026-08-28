# Course Content and Lesson Blocks

## Arabic Foundation course

`arabic-foundation-bn` is the first published Bangla → Arabic course. Its intentionally small path contains one level and four units: first letters, more letter sounds, first harakat, and first greetings. It includes ten letters (`ا ب ت ث ج ح خ د ذ ر`), Fatha/Kasra/Damma, six useful greeting phrases, and a small vocabulary set.

Bangla pronunciation strings are learner aids, not claims of exact equivalence. Content explicitly identifies sounds such as `ث`, `ح`, and `ذ` that have no exact Bangla match and pairs them with conservative articulation guidance. Makhraj data uses a broad region plus a descriptive sub-region; diagrams and acoustic scoring remain future work.

## Block contract

Every block has a stable ID, stable lesson relationship, type, position, schema version, required flag, publication status, and structured JSON payload. `src/server/content/schemas.ts` is the runtime contract. Supported block types are:

- `heading`, `explanation`, `arabic_text`, `vocabulary`, `phrase`, `example`, and `tip`;
- explicitly disabled `audio_placeholder` and `pronunciation_placeholder`;
- validated `exercise` references resolved through the Phase 4 engine;
- `continue`, represented by the shared lesson completion control.

Phase 4 publishes a moderate set of beginner activities: reading-direction multiple choice, letter/harakat matching, an Arabic fill blank, a greeting reorder, deterministic Bangla translation, and a flashcard check. Listen and speech records demonstrate CMS-ready contracts but remain visibly unavailable without real assets/providers. Conversation, writing, image, and video still require reviewed schemas and renderers. Adding a string to the database alone does not enable a type.

## Retrieval and publication

Students receive content only when course, level, unit, lesson, and block are published and the student has an active enrollment. A locked lesson is inaccessible by direct URL. Invalid blocks are skipped safely; content publishing checks should reject them before a later CMS marks them published.

References such as `letterKey`, `vocabularyKeys`, and `phraseKeys` resolve relational content records. The frontend does not contain the letter/phrase dataset. Arabic components apply `lang="ar"` and `dir="rtl"` locally while the Bangla UI remains LTR.

## Published edits and progress

Lesson IDs are durable learner-progress identities. Copy fixes may update a reviewed block while retaining lesson identity. Material changes should create a new reviewed block/content version and record the publication decision; they must not silently erase or reinterpret existing completions. Changes to required exercises, accepted answers, or completion rules need an explicit compatibility decision for learners who already completed the lesson. Exercise IDs/keys are durable attempt identities.

Blocks store `schema_version=1`; exercise scoring/retry/payload JSON has separate type-specific validation. A future editor should create drafts, validate the entire lesson version, publish atomically, and retain audit/version history. It must never copy authoritative answers into browser-facing block content.

## Seed policy

Phase 3 content uses stable `c3_` IDs; Phase 4 additions use stable `c4_` IDs and semantic keys. Unique constraints and convergent upserts prevent duplicates. Existing deployments apply additive migrations once; fresh installer migration deployment receives the same content. A future CMS/seeder must reuse these identities and validation rules.
