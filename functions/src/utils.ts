import { Task, TodoistApi } from "@doist/todoist-api-typescript";
import { Moment } from "moment-timezone";
import moment = require("moment-timezone");

// test
export const todoistApi = new TodoistApi(process.env.TODOIST_API_KEY!);

export function getTimezone(): string {
  return process.env.TIMEZONE || "America/Los_Angeles";
}

export function currentMoment(): Moment {
  return moment().tz(getTimezone());
}

/** Checks whether a task has a specific time configured (vs date-only). */
export function taskHasDueTime(task: Task): boolean {
  if (!task.due) {
    return false;
  }
  if (task.due.datetime) {
    return true;
  }
  if (task.due.date && task.due.date.includes("T")) {
    return true;
  }
  return false;
}

/** Returns a Moment in the configured timezone representing the task's due date and time. */
export function getTaskDueMoment(task: Task): Moment | undefined {
  if (!task.due || !task.due.date) {
    return undefined;
  }
  const tz = getTimezone();
  if (task.due.datetime) {
    return moment.tz(task.due.datetime, tz);
  }
  if (task.due.date.includes("T")) {
    return moment.tz(task.due.date, tz);
  }
  return moment.tz(task.due.date, tz).startOf("day");
}

/** Returns a set of lowercase label names that shouldn't be touched by anything. */
export async function getLowerLabelNamesToSkip(): Promise<Set<string>> {
  if (!process.env.IGNORE_LABELS) {
    console.error("No labels to ignore found");
    return new Set();
  }
  return new Set(
    process.env.IGNORE_LABELS.split(",").map((label) =>
      label.trim().toLowerCase()
    )
  );
}
