export type Lesson = {
  id: string;
  slug: string;
  title: string;
  duration: number;
  summary: string;
  content: string;
  starterCode: string;
  solution?: string;
  challenge?: string;
  tips?: string[];
  /** Set when flattening from a section */
  sectionId?: string;
  sectionTitle?: string;
  sectionSlug?: string;
};

export type Section = {
  id: string;
  slug: string;
  title: string;
  description: string;
  lessons: Omit<Lesson, "sectionId" | "sectionTitle" | "sectionSlug">[];
};

export type Module = {
  id: string;
  slug: string;
  number: number;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Quant";
  color: string;
  sections: Section[];
  /** Flat lesson list (filled by defineModule) */
  lessons: Lesson[];
};

export function defineModule(
  mod: Omit<Module, "lessons"> & { sections: Section[] }
): Module {
  const lessons: Lesson[] = mod.sections.flatMap((section) =>
    section.lessons.map((lesson) => ({
      ...lesson,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionSlug: section.slug,
    }))
  );
  return { ...mod, lessons };
}

export function L(
  partial: Omit<Lesson, "sectionId" | "sectionTitle" | "sectionSlug">
): Omit<Lesson, "sectionId" | "sectionTitle" | "sectionSlug"> {
  return partial;
}
