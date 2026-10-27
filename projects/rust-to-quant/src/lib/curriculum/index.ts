import type { Lesson, Module, Section } from "./types";
import { m01 } from "./m01-foundations";
import { m02 } from "./m02-ownership";
import { m03 } from "./m03-structs-enums";
import { m04ds } from "./m04-data-structures";
import { m04 } from "./m04-collections";
import { m05 } from "./m05-errors-traits";
import { m06 } from "./m06-concurrency";
import { m07 } from "./m07-ecosystem";
import { m08 } from "./m08-quant-math";
import { m09 } from "./m09-derivatives";
import { m10 } from "./m10-monte-carlo";
import { m11 } from "./m11-portfolio-risk";
import { m12 } from "./m12-pro-systems";

export type { Lesson, Module, Section } from "./types";
export { defineModule, L } from "./types";

/** Ordered path: foundations → ownership → types → **interview DS** → collections → … → quant. */
export const curriculum: Module[] = [
  m01,
  m02,
  m03,
  m04ds, // Module 4: Data Structures for Interviews
  m04, // Module 5: Collections & STL (iterators, quant-style pipelines)
  m05,
  m06,
  m07,
  m08,
  m09,
  m10,
  m11,
  m12,
];

export function getAllLessons(): (Lesson & { module: Module })[] {
  return curriculum.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, module }))
  );
}

export function getModule(slug: string): Module | undefined {
  return curriculum.find((m) => m.slug === slug);
}

export function getLesson(
  moduleSlug: string,
  lessonSlug: string
): { module: Module; lesson: Lesson; index: number; section?: Section } | undefined {
  const module = getModule(moduleSlug);
  if (!module) return undefined;
  const index = module.lessons.findIndex((l) => l.slug === lessonSlug);
  if (index < 0) return undefined;
  const lesson = module.lessons[index];
  const section = module.sections.find((s) => s.id === lesson.sectionId);
  return { module, lesson, index, section };
}

export function getAdjacentLessons(
  moduleSlug: string,
  lessonSlug: string
): {
  prev?: { moduleSlug: string; lessonSlug: string; title: string };
  next?: { moduleSlug: string; lessonSlug: string; title: string };
} {
  const all = getAllLessons();
  const idx = all.findIndex((l) => l.module.slug === moduleSlug && l.slug === lessonSlug);
  if (idx < 0) return {};
  const prevLesson = idx > 0 ? all[idx - 1] : undefined;
  const nextLesson = idx < all.length - 1 ? all[idx + 1] : undefined;
  return {
    prev: prevLesson
      ? {
          moduleSlug: prevLesson.module.slug,
          lessonSlug: prevLesson.slug,
          title: prevLesson.title,
        }
      : undefined,
    next: nextLesson
      ? {
          moduleSlug: nextLesson.module.slug,
          lessonSlug: nextLesson.slug,
          title: nextLesson.title,
        }
      : undefined,
  };
}

export function courseStats() {
  const lessons = getAllLessons();
  const minutes = lessons.reduce((a, l) => a + l.duration, 0);
  const sections = curriculum.reduce((a, m) => a + m.sections.length, 0);
  return {
    modules: curriculum.length,
    sections,
    lessons: lessons.length,
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10,
  };
}
