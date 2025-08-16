import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IHistConsult, NewHistConsult } from '../hist-consult.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IHistConsult for edit and NewHistConsultFormGroupInput for create.
 */
type HistConsultFormGroupInput = IHistConsult | PartialWithRequiredKeyOf<NewHistConsult>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IHistConsult | NewHistConsult> = Omit<T, 'dateTransaction'> & {
  dateTransaction?: string | null;
};

type HistConsultFormRawValue = FormValueOf<IHistConsult>;

type NewHistConsultFormRawValue = FormValueOf<NewHistConsult>;

type HistConsultFormDefaults = Pick<NewHistConsult, 'id' | 'dateTransaction'>;

type HistConsultFormGroupContent = {
  id: FormControl<HistConsultFormRawValue['id'] | NewHistConsult['id']>;
  labelAction: FormControl<HistConsultFormRawValue['labelAction']>;
  user: FormControl<HistConsultFormRawValue['user']>;
  dateTransaction: FormControl<HistConsultFormRawValue['dateTransaction']>;
  categorie: FormControl<HistConsultFormRawValue['categorie']>;
  navigateur: FormControl<HistConsultFormRawValue['navigateur']>;
  ip: FormControl<HistConsultFormRawValue['ip']>;
  terminal: FormControl<HistConsultFormRawValue['terminal']>;
};

export type HistConsultFormGroup = FormGroup<HistConsultFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class HistConsultFormService {
  createHistConsultFormGroup(histConsult: HistConsultFormGroupInput = { id: null }): HistConsultFormGroup {
    const histConsultRawValue = this.convertHistConsultToHistConsultRawValue({
      ...this.getFormDefaults(),
      ...histConsult,
    });
    return new FormGroup<HistConsultFormGroupContent>({
      id: new FormControl(
        { value: histConsultRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      labelAction: new FormControl(histConsultRawValue.labelAction),
      user: new FormControl(histConsultRawValue.user),
      dateTransaction: new FormControl(histConsultRawValue.dateTransaction),
      categorie: new FormControl(histConsultRawValue.categorie),
      navigateur: new FormControl(histConsultRawValue.navigateur),
      ip: new FormControl(histConsultRawValue.ip),
      terminal: new FormControl(histConsultRawValue.terminal),
    });
  }

  getHistConsult(form: HistConsultFormGroup): IHistConsult | NewHistConsult {
    return this.convertHistConsultRawValueToHistConsult(form.getRawValue() as HistConsultFormRawValue | NewHistConsultFormRawValue);
  }

  resetForm(form: HistConsultFormGroup, histConsult: HistConsultFormGroupInput): void {
    const histConsultRawValue = this.convertHistConsultToHistConsultRawValue({ ...this.getFormDefaults(), ...histConsult });
    form.reset(
      {
        ...histConsultRawValue,
        id: { value: histConsultRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): HistConsultFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      dateTransaction: currentTime,
    };
  }

  private convertHistConsultRawValueToHistConsult(
    rawHistConsult: HistConsultFormRawValue | NewHistConsultFormRawValue
  ): IHistConsult | NewHistConsult {
    return {
      ...rawHistConsult,
      dateTransaction: dayjs(rawHistConsult.dateTransaction, DATE_TIME_FORMAT),
    };
  }

  private convertHistConsultToHistConsultRawValue(
    histConsult: IHistConsult | (Partial<NewHistConsult> & HistConsultFormDefaults)
  ): HistConsultFormRawValue | PartialWithRequiredKeyOf<NewHistConsultFormRawValue> {
    return {
      ...histConsult,
      dateTransaction: histConsult.dateTransaction ? histConsult.dateTransaction.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
