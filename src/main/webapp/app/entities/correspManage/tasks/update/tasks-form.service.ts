import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { ITasks, NewTasks } from '../tasks.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ITasks for edit and NewTasksFormGroupInput for create.
 */
type TasksFormGroupInput = ITasks | PartialWithRequiredKeyOf<NewTasks>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends ITasks | NewTasks> = Omit<T, 'creationDate' | 'startDate' | 'dueDate' | 'closeDate' | 'updatedDate'> & {
  creationDate?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  closeDate?: string | null;
  updatedDate?: string | null;
};

type TasksFormRawValue = FormValueOf<ITasks>;

type NewTasksFormRawValue = FormValueOf<NewTasks>;

type TasksFormDefaults = Pick<NewTasks, 'id' | 'creationDate' | 'startDate' | 'dueDate' | 'closeDate' | 'updatedDate' | 'corresps'>;

type TasksFormGroupContent = {
  id: FormControl<TasksFormRawValue['id'] | NewTasks['id']>;
  object: FormControl<TasksFormRawValue['object']>;
  content: FormControl<TasksFormRawValue['content']>;
  contentContentType: FormControl<TasksFormRawValue['contentContentType']>;
  creationDate: FormControl<TasksFormRawValue['creationDate']>;
  startDate: FormControl<TasksFormRawValue['startDate']>;
  dueDate: FormControl<TasksFormRawValue['dueDate']>;
  closeDate: FormControl<TasksFormRawValue['closeDate']>;
  responsible: FormControl<TasksFormRawValue['responsible']>;
  status: FormControl<TasksFormRawValue['status']>;
  createdBy: FormControl<TasksFormRawValue['createdBy']>;
  updatedBy: FormControl<TasksFormRawValue['updatedBy']>;
  updatedDate: FormControl<TasksFormRawValue['updatedDate']>;
  corresps: FormControl<TasksFormRawValue['corresps']>;
};

export type TasksFormGroup = FormGroup<TasksFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class TasksFormService {
  createTasksFormGroup(tasks: TasksFormGroupInput = { id: null }): TasksFormGroup {
    const tasksRawValue = this.convertTasksToTasksRawValue({
      ...this.getFormDefaults(),
      ...tasks,
    });
    return new FormGroup<TasksFormGroupContent>({
      id: new FormControl(
        { value: tasksRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      object: new FormControl(tasksRawValue.object, {
        validators: [Validators.required],
      }),
      content: new FormControl(tasksRawValue.content),
      contentContentType: new FormControl(tasksRawValue.contentContentType),
      creationDate: new FormControl(tasksRawValue.creationDate),
      startDate: new FormControl(tasksRawValue.startDate),
      dueDate: new FormControl(tasksRawValue.dueDate),
      closeDate: new FormControl(tasksRawValue.closeDate),
      responsible: new FormControl(tasksRawValue.responsible),
      status: new FormControl(tasksRawValue.status),
      createdBy: new FormControl(tasksRawValue.createdBy),
      updatedBy: new FormControl(tasksRawValue.updatedBy),
      updatedDate: new FormControl(tasksRawValue.updatedDate),
      corresps: new FormControl(tasksRawValue.corresps ?? []),
    });
  }

  getTasks(form: TasksFormGroup): ITasks | NewTasks {
    return this.convertTasksRawValueToTasks(form.getRawValue() as TasksFormRawValue | NewTasksFormRawValue);
  }

  resetForm(form: TasksFormGroup, tasks: TasksFormGroupInput): void {
    const tasksRawValue = this.convertTasksToTasksRawValue({ ...this.getFormDefaults(), ...tasks });
    form.reset(
      {
        ...tasksRawValue,
        id: { value: tasksRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): TasksFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      creationDate: currentTime,
      startDate: currentTime,
      dueDate: currentTime,
      closeDate: currentTime,
      updatedDate: currentTime,
      corresps: [],
    };
  }

  private convertTasksRawValueToTasks(rawTasks: TasksFormRawValue | NewTasksFormRawValue): ITasks | NewTasks {
    return {
      ...rawTasks,
      creationDate: dayjs(rawTasks.creationDate, DATE_TIME_FORMAT),
      startDate: dayjs(rawTasks.startDate, DATE_TIME_FORMAT),
      dueDate: dayjs(rawTasks.dueDate, DATE_TIME_FORMAT),
      closeDate: dayjs(rawTasks.closeDate, DATE_TIME_FORMAT),
      updatedDate: dayjs(rawTasks.updatedDate, DATE_TIME_FORMAT),
    };
  }

  private convertTasksToTasksRawValue(
    tasks: ITasks | (Partial<NewTasks> & TasksFormDefaults)
  ): TasksFormRawValue | PartialWithRequiredKeyOf<NewTasksFormRawValue> {
    return {
      ...tasks,
      creationDate: tasks.creationDate ? tasks.creationDate.format(DATE_TIME_FORMAT) : undefined,
      startDate: tasks.startDate ? tasks.startDate.format(DATE_TIME_FORMAT) : undefined,
      dueDate: tasks.dueDate ? tasks.dueDate.format(DATE_TIME_FORMAT) : undefined,
      closeDate: tasks.closeDate ? tasks.closeDate.format(DATE_TIME_FORMAT) : undefined,
      updatedDate: tasks.updatedDate ? tasks.updatedDate.format(DATE_TIME_FORMAT) : undefined,
      corresps: tasks.corresps ?? [],
    };
  }
}
