import { Request, Response } from "express";
import { currentMoment, getLowerLabelNamesToSkip, taskHasDueTime, todoistApi } from "./utils";
import moment = require("moment-timezone");
import { Task, UpdateTaskArgs } from "@doist/todoist-api-typescript";

export abstract class BaseRescheduler {
  abstract getRescheduleTime({
    task,
    now,
  }: {
    task: Task;
    now: moment.Moment;
  }): Promise<moment.Moment | undefined>;

  async reschedule(request: Request, response: Response): Promise<void> {
    if (request.query["authKey"] !== process.env.AUTH_KEY) {
      response.sendStatus(403);
      return;
    }

    const isDryRun =
      request.query["dry_run"] === "true" ||
      request.query["dryRun"] === "true" ||
      process.env.DRY_RUN === "true";

    const allTasks = (await todoistApi.getTasks()).results;
    const lowerLabelsToSkip = await getLowerLabelNamesToSkip();
    const now = currentMoment();

    const rescheduledTasks = await Promise.all(
      allTasks.map((task) =>
        this.rescheduleTask(task, lowerLabelsToSkip, now, isDryRun)
      )
    );

    const numComplete = rescheduledTasks.filter((success) => success).length;

    const message = isDryRun
      ? `[DRY RUN] Would update ${numComplete} tasks`
      : `Updated ${numComplete} tasks`;
    console.log(message);
    response.send(message);
  }

  private async rescheduleTask(
    task: Task,
    lowerLabelsToSkip: Set<string>,
    now: moment.Moment,
    isDryRun: boolean = false
  ): Promise<boolean> {
    // If the task doesn't have a date, it can't be rescheduled.
    if (!task.due || !task.due.date) {
      return false;
    }

    // If the task has an ignore label, it shouldn't be rescheduled.
    if (
      task.labels.some((label) =>
        lowerLabelsToSkip.has(label.trim().toLocaleLowerCase())
      )
    ) {
      return false;
    }

    // Check with the child.
    const rescheduleTime = await this.getRescheduleTime({ task, now });
    if (!rescheduleTime) {
      return false;
    }

    // If the original task had a time, update the datetime; otherwise update the date.
    let updateArg: UpdateTaskArgs;
    if (taskHasDueTime(task)) {
      updateArg = {
        dueDatetime: rescheduleTime.toISOString(),
      };
    } else {
      const formattedRescheduleDate = rescheduleTime.format("YYYY-MM-DD");
      updateArg = { dueDate: formattedRescheduleDate };
    }

    console.log(
      `${isDryRun ? "[DRY RUN] Would reschedule" : "Rescheduling"} ${task.content} for ${JSON.stringify(updateArg)}`
    );

    if (isDryRun) {
      return true;
    }

    try {
      // @ts-ignore
      const result = await todoistApi.updateTask(task.id, updateArg);
      if (result) {
        return true;
      }
      console.error("Problem updating task", task);
    } catch (error) {
      console.error(`Error encountered updating task ${task.content}`, error);
    }
    return false;
  }
}
