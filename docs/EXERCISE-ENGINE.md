# Exercise Engine

## Boundary

Phase 4 provides one reusable, server-authoritative attempt and scoring path. Lesson blocks contain `{ schemaVersion: 1, exerciseKey }`; the referenced published exercise contains the private authoring payload. The learner receives only a validated redacted public payload. Authoritative answers are never React constants or accepted from the browser.

## Types and payload contracts

| Type | Private authority | Public interaction | Phase 4 result |
| --- | --- | --- | --- |
| `multiple_choice` | options, correct option, localized explanation | option labels | exact selected ID |
| `matching` | stable left/right pairs | shuffled right IDs and labels | complete mapping plus partial score |
| `reorder` | tokens and correct ID order | deliberately reordered tokens | exact complete sequence |
| `fill_blank` | accepted answers, optional display answer | text field | deterministic accepted text |
| `translation` | accepted translations, optional display answer | text field | deterministic accepted text |
| `listen_select` | audio asset and correct option | asset availability and options | exact ID only when an asset exists |
| `listen_type` | audio asset and accepted text | asset availability and input | deterministic text only when an asset exists |
| `flashcard_check` | front and localized back | reveal, Know it / Need review | explicit learner review signal |
| `read_aloud_placeholder` | unavailable marker | disabled card | unavailable until speech phase |
| `speak_placeholder` | unavailable marker | disabled card | unavailable until speech phase |

All authoring payloads, scoring settings, retry settings, public references, responses, and action envelopes are Zod validated. Unknown exercise types or malformed database JSON fail closed.

## Scoring and normalization

The server reloads the private payload and computes correctness and a 0–100 score. It applies Unicode NFKC, trims boundaries, and collapses repeated whitespace. Case folding is opt-in. Arabic marks are governed by each exercise’s `required`, `optional`, or `ignored` setting; meaningful Arabic content is never stripped globally. Translation and fill-blank grading are deterministic accepted-answer comparisons—no AI call is made.

Matching can return a partial numeric score while correctness still requires every unique pair. Reorder requires the full sequence. Flashcard “Need review” creates an incorrect/review signal without punishment or XP loss. Speech placeholders never manufacture scores.

## Attempts, retries, and idempotency

Before accepting a response, the service verifies the active student, enrollment, published course/level/unit/lesson, unlocked sequence position, published exercise, and exercise-to-lesson relationship. The exercise row is transactionally locked. A unique learner request ID handles double clicks and network retries; a second unique key protects attempt numbering.

Retry configuration supports unlimited beginner-friendly practice or a bounded maximum and can require a correct response before continuing. Feedback includes correctness, score, localized explanation, an expected answer where pedagogically appropriate, retry availability, attempt number, and next action. The client never supplies those values.

An accepted submission writes one attempt, updates one review aggregate, and increments learner-local daily exercise activity. Page loads and background reads do not create activity. Exercise attempts award no XP in Phase 4; existing lesson-completion XP stays one-time through the XP ledger uniqueness key.

## Completion rules

Lesson JSON policy can require all required exercises to be attempted, require all to be correct, and set a minimum score. The lesson service calculates score from the best persisted score for each required published exercise. Required block viewing remains represented by the learner’s explicit final completion action until granular view events are justified. Existing lessons with no required exercises remain compatible.

Completion, score, and mastery are separate. Completing a lesson writes a score and advances the course, but does not claim long-term mastery. Material edits to published exercises require reviewed content/version policy so existing attempts remain attached to stable lesson/exercise identities.

## Future extension points

Speech phases can attach transient audio metadata and derived provider results without requiring permanent raw audio. AI conversation, pronunciation, writing evaluation, and adaptive review should add typed response/result detail to the same exercise/attempt boundary rather than create competing attempt systems. Provider calls must remain server-side, bounded, auditable, and unable to award progress directly. The current review signal is deliberately not a spaced-repetition scheduler.
