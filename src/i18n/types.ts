export const supportedLocales = ["bn", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

export type Messages = {
  foundation: {
    eyebrow: string;
    heading: string;
    description: string;
    status: string;
  };
  learner: {
    nav: Record<"home"|"learn"|"review"|"practice"|"tutor"|"profile"|"settings"|"soon"|"logout", string>;
    onboarding: { eyebrow:string; title:string; intro:string; back:string; next:string; finish:string; saving:string; step:string; error:string; minuteUnit:string; questions:Record<"level"|"goal"|"daily"|"mode",string>; levels:Record<string,string>; goals:Record<string,string>; modes:Record<string,string>; recommendations:Record<string,string> };
    dashboard: Record<"eyebrow"|"greeting"|"subtitle"|"continue"|"course"|"currentPath"|"startingPoint"|"progress"|"todayGoal"|"streak"|"xp"|"lessons"|"words"|"reviews"|"achievement"|"emptyAchievement"|"minutes"|"days"|"coursePreparing"|"viewCourse",string>;
    course: Record<"eyebrow"|"languages"|"path"|"empty"|"draftNotice"|"completed"|"current"|"available"|"locked"|"lessonsSoon"|"back",string>;
    lesson: Record<"back"|"previous"|"next"|"alreadyCompleted"|"comingSoon"|"audio"|"pronunciation"|"check"|"checking"|"correct"|"incorrect"|"questionRequired"|"complete"|"completing"|"completed"|"xp"|"error"|"isolated"|"initial"|"medial"|"final"|"formsLabel"|"makhraj"|"pronunciationTip"|"retry"|"expected"|"attempt"|"unavailable"|"audioUnavailable"|"knowIt"|"needReview"|"reveal"|"moveUp"|"moveDown"|"selectMatch"|"typeAnswer"|"rateLimited",string>;
    profile: Record<"eyebrow"|"title"|"subtitle"|"fullName"|"displayName"|"email"|"avatar"|"nativeLanguage"|"learningLanguage"|"country"|"timezone"|"learningGoal"|"dailyGoal"|"save"|"saving"|"success"|"error"|"avatarComingSoon"|"minuteUnit",string>;
    settings: Record<"eyebrow"|"title"|"subtitle"|"language"|"mode"|"dailyGoal"|"audio"|"voice"|"notifications"|"soon"|"save"|"saving"|"success"|"error",string>;
  };
};
