import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IHistAction, NewHistAction } from '../hist-action.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IHistAction for edit and NewHistActionFormGroupInput for create.
 */
type HistActionFormGroupInput = IHistAction | PartialWithRequiredKeyOf<NewHistAction>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IHistAction | NewHistAction> = Omit<T, 'dateTransaction'> & {
  dateTransaction?: string | null;
};

type HistActionFormRawValue = FormValueOf<IHistAction>;

type NewHistActionFormRawValue = FormValueOf<NewHistAction>;

type HistActionFormDefaults = Pick<NewHistAction, 'id' | 'dateTransaction'>;

type HistActionFormGroupContent = {
  id: FormControl<HistActionFormRawValue['id'] | NewHistAction['id']>;
  dateTransaction: FormControl<HistActionFormRawValue['dateTransaction']>;
  loginUser: FormControl<HistActionFormRawValue['loginUser']>;
  transaction: FormControl<HistActionFormRawValue['transaction']>;
  actionRef: FormControl<HistActionFormRawValue['actionRef']>;
  actionJson: FormControl<HistActionFormRawValue['actionJson']>;
};

export type HistActionFormGroup = FormGroup<HistActionFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class HistActionFormService {
  createHistActionFormGroup(histAction: HistActionFormGroupInput = { id: null }): HistActionFormGroup {
    const histActionRawValue = this.convertHistActionToHistActionRawValue({
      ...this.getFormDefaults(),
      ...histAction,
    });
    return new FormGroup<HistActionFormGroupContent>({
      id: new FormControl(
        { value: histActionRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      dateTransaction: new FormControl(histActionRawValue.dateTransaction),
      loginUser: new FormControl(histActionRawValue.loginUser),
      transaction: new FormControl(histActionRawValue.transaction),
      actionRef: new FormControl(histActionRawValue.actionRef),
      actionJson: new FormControl(histActionRawValue.actionJson),
    });
  }

  getHistAction(form: HistActionFormGroup): IHistAction | NewHistAction {
    return this.convertHistActionRawValueToHistAction(form.getRawValue() as HistActionFormRawValue | NewHistActionFormRawValue);
  }

  resetForm(form: HistActionFormGroup, histAction: HistActionFormGroupInput): void {
    const histActionRawValue = this.convertHistActionToHistActionRawValue({ ...this.getFormDefaults(), ...histAction });
    form.reset(
      {
        ...histActionRawValue,
        id: { value: histActionRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): HistActionFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      dateTransaction: currentTime,
    };
  }

  private convertHistActionRawValueToHistAction(
    rawHistAction: HistActionFormRawValue | NewHistActionFormRawValue
  ): IHistAction | NewHistAction {
    return {
      ...rawHistAction,
      dateTransaction: dayjs(rawHistAction.dateTransaction, DATE_TIME_FORMAT),
    };
  }

  private convertHistActionToHistActionRawValue(
    histAction: IHistAction | (Partial<NewHistAction> & HistActionFormDefaults)
  ): HistActionFormRawValue | PartialWithRequiredKeyOf<NewHistActionFormRawValue> {
    return {
      ...histAction,
      dateTransaction: histAction.dateTransaction ? histAction.dateTransaction.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
