export type View = 'today' | 'week' | 'kit';

export type ProgressState = {
  answers: Record<string, number[]>;
  cursors: Record<string, number>;
  completed: number[];
  currentDay: number;
  lastView: View;
};

export const emptyProgress: ProgressState = {
  answers: {},
  cursors: {},
  completed: [],
  currentDay: 1,
  lastView: 'today',
};

const dayNumbers = Array.from({ length: 7 }, (_, index) => index + 1);

export function normalizeProgress(value: unknown): ProgressState | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<ProgressState>;
  const answers: Record<string, number[]> = {};
  const cursors: Record<string, number> = {};

  if (
    candidate.answers !== undefined &&
    (!candidate.answers || typeof candidate.answers !== 'object')
  )
    return null;
  if (
    candidate.cursors !== undefined &&
    (!candidate.cursors || typeof candidate.cursors !== 'object')
  )
    return null;

  for (const dayNumber of dayNumbers) {
    const key = String(dayNumber);
    const dayAnswers = candidate.answers?.[key];
    if (dayAnswers !== undefined) {
      if (
        !Array.isArray(dayAnswers) ||
        dayAnswers.length > 2 ||
        dayAnswers.some(
          (answer) => !Number.isInteger(answer) || answer < 0 || answer > 2,
        )
      ) {
        return null;
      }
      if (dayAnswers.length) answers[key] = [...dayAnswers];
    }

    const cursor = candidate.cursors?.[key];
    if (cursor !== undefined) {
      if (!Number.isInteger(cursor) || cursor < 0 || cursor > 1) return null;
      cursors[key] = cursor;
    }
  }

  const completed = candidate.completed ?? [];
  if (
    !Array.isArray(completed) ||
    completed.some((day) => !Number.isInteger(day) || day < 1 || day > 7)
  )
    return null;

  const currentDay =
    Number.isInteger(candidate.currentDay) &&
    candidate.currentDay! >= 1 &&
    candidate.currentDay! <= 7
      ? candidate.currentDay!
      : 1;
  const lastView =
    candidate.lastView === 'week' || candidate.lastView === 'kit'
      ? candidate.lastView
      : 'today';

  return {
    answers,
    cursors,
    completed: [...new Set(completed)].sort((a, b) => a - b),
    currentDay,
    lastView,
  };
}

export function mergeProgress(
  stored: ProgressState,
  incoming: ProgressState,
): ProgressState {
  const answers: Record<string, number[]> = {};
  const cursors: Record<string, number> = {};

  for (const dayNumber of dayNumbers) {
    const key = String(dayNumber);
    const storedAnswers = stored.answers[key] ?? [];
    const incomingAnswers = incoming.answers[key] ?? [];
    const answerCount = Math.max(storedAnswers.length, incomingAnswers.length);
    const mergedAnswers = Array.from(
      { length: answerCount },
      (_, index) => incomingAnswers[index] ?? storedAnswers[index],
    );
    if (mergedAnswers.length) answers[key] = mergedAnswers;

    const storedCursor = stored.cursors[key];
    const incomingCursor = incoming.cursors[key];
    if (storedCursor !== undefined || incomingCursor !== undefined) {
      cursors[key] = Math.max(storedCursor ?? 0, incomingCursor ?? 0);
    }
  }

  return {
    answers,
    cursors,
    completed: [...new Set([...stored.completed, ...incoming.completed])].sort(
      (a, b) => a - b,
    ),
    currentDay: incoming.currentDay,
    lastView: incoming.lastView,
  };
}
