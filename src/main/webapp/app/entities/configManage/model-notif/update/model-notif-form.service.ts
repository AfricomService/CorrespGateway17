import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IModelNotif, NewModelNotif } from '../model-notif.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IModelNotif for edit and NewModelNotifFormGroupInput for create.
 */
type ModelNotifFormGroupInput = IModelNotif | PartialWithRequiredKeyOf<NewModelNotif>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IModelNotif | NewModelNotif> = Omit<T, 'createdDate'> & {
  createdDate?: string | null;
};

type ModelNotifFormRawValue = FormValueOf<IModelNotif>;

type NewModelNotifFormRawValue = FormValueOf<NewModelNotif>;

type ModelNotifFormDefaults = Pick<NewModelNotif, 'id' | 'createdDate'>;

type ModelNotifFormGroupContent = {
  id: FormControl<ModelNotifFormRawValue['id'] | NewModelNotif['id']>;
  name: FormControl<ModelNotifFormRawValue['name']>;
  famille: FormControl<ModelNotifFormRawValue['famille']>;
  code: FormControl<ModelNotifFormRawValue['code']>;
  content: FormControl<ModelNotifFormRawValue['content']>;
  subjectFormula: FormControl<ModelNotifFormRawValue['subjectFormula']>;
  senderEmailFormule: FormControl<ModelNotifFormRawValue['senderEmailFormule']>;
  recepientEmailFormule: FormControl<ModelNotifFormRawValue['recepientEmailFormule']>;
  createdDate: FormControl<ModelNotifFormRawValue['createdDate']>;
};

export type ModelNotifFormGroup = FormGroup<ModelNotifFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ModelNotifFormService {
  createModelNotifFormGroup(modelNotif: ModelNotifFormGroupInput = { id: null }): ModelNotifFormGroup {
    const modelNotifRawValue = this.convertModelNotifToModelNotifRawValue({
      ...this.getFormDefaults(),
      ...modelNotif,
    });
    return new FormGroup<ModelNotifFormGroupContent>({
      id: new FormControl(
        { value: modelNotifRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      name: new FormControl(modelNotifRawValue.name, {
        validators: [Validators.required],
      }),
      famille: new FormControl(modelNotifRawValue.famille),
      code: new FormControl(modelNotifRawValue.code),
      content: new FormControl(modelNotifRawValue.content),
      subjectFormula: new FormControl(modelNotifRawValue.subjectFormula),
      senderEmailFormule: new FormControl(modelNotifRawValue.senderEmailFormule, {
        validators: [Validators.required],
      }),
      recepientEmailFormule: new FormControl(modelNotifRawValue.recepientEmailFormule),
      createdDate: new FormControl(modelNotifRawValue.createdDate, {
        validators: [Validators.required],
      }),
    });
  }

  getModelNotif(form: ModelNotifFormGroup): IModelNotif | NewModelNotif {
    return this.convertModelNotifRawValueToModelNotif(form.getRawValue() as ModelNotifFormRawValue | NewModelNotifFormRawValue);
  }

  resetForm(form: ModelNotifFormGroup, modelNotif: ModelNotifFormGroupInput): void {
    const modelNotifRawValue = this.convertModelNotifToModelNotifRawValue({ ...this.getFormDefaults(), ...modelNotif });
    form.reset(
      {
        ...modelNotifRawValue,
        id: { value: modelNotifRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): ModelNotifFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      createdDate: currentTime,
    };
  }

  private convertModelNotifRawValueToModelNotif(
    rawModelNotif: ModelNotifFormRawValue | NewModelNotifFormRawValue
  ): IModelNotif | NewModelNotif {
    return {
      ...rawModelNotif,
      createdDate: dayjs(rawModelNotif.createdDate, DATE_TIME_FORMAT),
    };
  }

  private convertModelNotifToModelNotifRawValue(
    modelNotif: IModelNotif | (Partial<NewModelNotif> & ModelNotifFormDefaults)
  ): ModelNotifFormRawValue | PartialWithRequiredKeyOf<NewModelNotifFormRawValue> {
    return {
      ...modelNotif,
      createdDate: modelNotif.createdDate ? modelNotif.createdDate.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
