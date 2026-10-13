import { Moment } from "moment-timezone";
import { getTaskDueMoment, taskHasDueTime, todoistApi } from "./utils";
import { BaseRescheduler } from "./rescheduler";
import { PersonalProject, WorkspaceProject, Task } from "@doist/todoist-api-typescript";

export class WorkdayTaskRescheduler extends BaseRescheduler {
  /** Cached work project IDs for the life of the rescheduler. */
  private projectIdsToReschedule: Promise<Set<string>>;

  constructor() {
    super();
    this.projectIdsToReschedule = getWorkProjectIds();
  }

  async getRescheduleTime({
    task,
    now,
  }: {
    task: Task;
    now: Moment;
  }): Promise<Moment | undefined> {
    const taskDueDate = getTaskDueMoment(task);
    if (!taskDueDate) {
      return;
    }

    // Tasks already scheduled in the future should not be rescheduled.
    if (taskDueDate.isAfter(now)) {
      return;
    }

    // Filter to just work tasks.
    const projectIdsToReschedule = await this.projectIdsToReschedule;
    if (!projectIdsToReschedule.has(task.projectId)) {
      return;
    }

    const nextWorkday = getNextWorkday(now);
    if (taskHasDueTime(task)) {
      return nextWorkday
        .clone()
        .hour(taskDueDate.hour())
        .minute(taskDueDate.minute())
        .second(taskDueDate.second());
    }

    return nextWorkday.clone().startOf("day");
  }
}

async function getWorkProjectIds(): Promise<Set<string>> {
  if (!process.env.WORK_PROJECTS_TO_RESCHEDULE) {
    console.error("No projects to reschedule found");
    return new Set();
  }
  const lowerProjectNames = new Set(
    process.env.WORK_PROJECTS_TO_RESCHEDULE.split(",").map((project) =>
      project.trim().toLowerCase()
    )
  );
  const projects: (PersonalProject | WorkspaceProject)[] = (await todoistApi.getProjects()).results;
  return new Set(
    projects
      .filter((project) =>
        lowerProjectNames.has(project.name.trim().toLowerCase())
      )
      .map((project) => project.id)
  );
}

const ISO_WEEKDAY_MONDAY = 1;
const ISO_WEEKDAY_FRIDAY = 5;

function getNextWorkday(now: Moment): Moment {
  const next = now.clone();
  const nextIsoWeekday = next.isoWeekday() + 1;
  if (nextIsoWeekday <= ISO_WEEKDAY_FRIDAY) {
    return next.isoWeekday(nextIsoWeekday).startOf("day");
  } else {
    // On weekends, defer to next Monday.
    return next.add(1, "weeks").isoWeekday(ISO_WEEKDAY_MONDAY).startOf("day");
  }
}
