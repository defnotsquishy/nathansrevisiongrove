import { emptyState, stateSchema, topics, type AppState } from './model';
export type Saved = { state: AppState; revision: number };
const KEY = 'revision-grove-plan-v1';
export function readDevicePlan(): Saved {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    throw new Error(
      'Device storage is unavailable. Allow site storage to keep your progress.',
    );
  }
  if (raw === null) {
    const state = emptyState();
    state.settings.name = 'Student';
    return { state, revision: 0 };
  }
  try {
    const data = JSON.parse(raw);
    const state = stateSchema.parse(data.state);
    if (!Number.isSafeInteger(data.revision) || data.revision < 0)
      throw new Error('Invalid revision');
    return { state, revision: data.revision };
  } catch {
    throw new Error(
      'Your saved plan could not be read. It has not been replaced. Restore a valid backup to recover it.',
    );
  }
}
export function writeDevicePlan(state: AppState, revision: number): Saved {
  const current = readDevicePlan();
  if (current.revision !== revision)
    throw new Error(
      'Your plan changed in another tab. Reload the saved plan before trying again.',
    );
  const next = { state: stateSchema.parse(state), revision: revision + 1 };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new Error(
      'Your device could not save the change. Free some storage and try again.',
    );
  }
  return next;
}
// Only called after the user previews and explicitly confirms a restore.
export function restoreDevicePlan(state: AppState): Saved {
  const next = { state: stateSchema.parse(state), revision: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new Error(
      'The backup could not be saved on this device. Allow site storage and try again.',
    );
  }
  return next;
}
export function exportBackup(state: AppState) {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          { format: 'revision-grove', version: 1, state },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    ),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'revision-grove-backup.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function readBackup(file: File) {
  if (file.size > 2_000_000)
    throw new Error(
      'This backup is too large. Choose a Revision Grove JSON backup under 2 MB.',
    );
  let value;
  try {
    value = JSON.parse(await file.text());
  } catch {
    throw new Error('This is not a valid JSON backup.');
  }
  if (value.format !== 'revision-grove' || value.version !== 1)
    throw new Error('Choose a Revision Grove version 1 backup.');
  const result = stateSchema.safeParse(value.state);
  if (!result.success)
    throw new Error(
      'This backup contains invalid plan data. Your current plan is unchanged.',
    );
  const ids = new Set([
    ...topics.map((t) => t.id),
    ...result.data.customTopics.map((t) => t.id),
  ]);
  if (
    result.data.sessions.some((s) => !ids.has(s.topicId)) ||
    result.data.logs.some((l) => !ids.has(l.topicId))
  )
    throw new Error(
      'This backup refers to missing topics. Your current plan is unchanged.',
    );
  return result.data;
}
