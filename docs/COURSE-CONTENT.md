# Course Content and Lesson Blocks

## Phase 3 course

`arabic-foundation-bn` is the first published Bangla → Arabic course. Its intentionally small path contains one level and four units: first letters, more letter sounds, first harakat, and first greetings. It includes ten letters (`ا ب ت ث ج ح خ د ذ ر`), Fatha/Kasra/Damma, six useful greeting phrases, and a small vocabulary set.

Bangla pronunciation strings are learner aids, not claims of exact equivalence. Content explicitly identifies sounds such as `ث`, `ح`, and `ذ` that have no exact Bangla match and pairs them with conservative articulation guidance. Makhraj data uses a broad region plus a descriptive sub-region; diagrams and acoustic scoring remain future work.

## Block contract

Every block has a stable ID, stable lesson relationship, type, position, schema version, required flag, publication status, and structured JSON payload. `src/server/content/schemas.ts` is the runtime contract. Supported Phase 3 types are:

- `heading`, `explanation`, `arabic_text`, `vocabulary`, `phrase`, `example`, and `tip`;
- explicitly disabled `audio_placeholder` and `pronunciation_placeholder`;
- server-scored `multiple_choice`;
- `continue`, represented by the shared lesson completion control.

Planned types such as image, video, matching, reorder, fill-blank, listening, speaking, translation, flashcard, conversation, and writing require their own schema, public-data policy, renderer, accessibility behavior, and completion rule before use. Adding a string to the database alone does not enable a block.

## Retrieval and publication

Students receive content only when course, level, unit, lesson, and block are published and the student has an active enrollment. A locked lesson is inaccessible by direct URL. Invalid blocks are skipped safely; content publishing checks should reject them before a later CMS marks them published.

References such as `letterKey`, `vocabularyKeys`, and `phraseKeys` resolve relational content records. The frontend does not contain the letter/phrase dataset. Arabic components apply `lang="ar"` and `dir="rtl"` locally while the Bangla UI remains LTR.

## Published edits and progress

Lesson IDs are durable learner-progress identities. Copy fixes may update a reviewed block while retaining lesson identity. Material changes should create a new reviewed block/content version and record the publication decision; they must not silently erase or reinterpret existing completions. Changes to required questions or completion rules need an explicit compatibility decision for learners who already completed the lesson.

Phase 3 stores `schema_version=1`. A future editor should create drafts, validate the entire lesson version, publish atomically, and retain audit/version history. It must never edit the authoritative answer into browser-facing content.

## Seed policy

Phase 3 migration content uses stable `c3_` IDs, stable slugs/keys, unique constraints, and idempotent upserts. Existing deployments apply the additive migration once; fresh installer migration deployment receives the same content. A future standalone content seeder must reuse these keys and convergence behavior rather than generate duplicates.

