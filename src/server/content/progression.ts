export type LessonSequenceItem={id:string;completed:boolean};
export function firstIncompleteLesson(items:readonly LessonSequenceItem[]){return items.find(item=>!item.completed)?.id??null;}
export function canAccessLesson(items:readonly LessonSequenceItem[],lessonId:string){const item=items.find(value=>value.id===lessonId);return Boolean(item&&(item.completed||firstIncompleteLesson(items)===lessonId));}
export function nextLessonId(items:readonly LessonSequenceItem[],lessonId:string){const index=items.findIndex(item=>item.id===lessonId);return index>=0?items[index+1]?.id??null:null;}

