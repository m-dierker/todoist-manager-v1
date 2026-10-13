import moment = require("moment-timezone");
import { BaseRescheduler } from "./rescheduler";
import { Task } from "@doist/todoist-api-typescript";
import { getTaskDueMoment, taskHasDueTime } from "./utils";

/** Reschedules tasks that were scheduled for the previous day. */
export class OverdueTaskRescheduler extends BaseRescheduler {
  async getRescheduleTime({
    task,
    now,
  }: {
    task: Task;
    now: moment.Moment;
  }): Promise<moment.Moment | undefined> {
    const startOfCurrentDay = now.clone().startOf("day");
    console.log(task.content, task.due);

    const taskDueDate = getTaskDueMoment(task);
    if (!taskDueDate) {
      return undefined;
    }

    // If a task isn't due yet, no adjustment is needed.
    if (!taskDueDate.isBefore(startOfCurrentDay)) {
      return undefined;
    }

    // If the task has a specific due time, adjust the day while keeping that time.
    if (taskHasDueTime(task)) {
      const todaySameTime = startOfCurrentDay
        .clone()
        .hour(taskDueDate.hour())
        .minute(taskDueDate.minute())
        .second(taskDueDate.second());
      console.log("todaySameTime", todaySameTime);
      return todaySameTime;
    }

    return startOfCurrentDay;
  }
}
