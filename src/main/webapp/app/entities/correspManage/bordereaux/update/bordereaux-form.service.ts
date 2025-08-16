import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IBordereaux, NewBordereaux } from '../bordereaux.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IBordereaux for edit and NewBordereauxFormGroupInput for create.
 */
type BordereauxFormGroupInput = IBordereaux | PartialWithRequiredKeyOf<NewBordereaux>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IBordereaux | NewBordereaux> = Omit<T, 'issuedDate' | 'dueDate' | 'createdDate' | 'updatedDate'> & {
  issuedDate?: string | null;
  dueDate?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
};

type BordereauxFormRawValue = FormValueOf<IBordereaux>;

type NewBordereauxFormRawValue = FormValueOf<NewBordereaux>;

type BordereauxFormDefaults = Pick<NewBordereaux, 'id' | 'issuedDate' | 'dueDate' | 'createdDate' | 'updatedDate' | 'corresps'>;

type BordereauxFormGroupContent = {
  id: FormControl<BordereauxFormRawValue['id'] | NewBordereaux['id']>;
  reference: FormControl<BordereauxFormRawValue['reference']>;
  description: FormControl<BordereauxFormRawValue['description']>;
  amount: FormControl<BordereauxFormRawValue['amount']>;
  currency: FormControl<BordereauxFormRawValue['currency']>;
  status: FormControl<BordereauxFormRawValue['status']>;
  issuedDate: FormControl<BordereauxFormRawValue['issuedDate']>;
  dueDate: FormControl<BordereauxFormRawValue['dueDate']>;
  createdDate: FormControl<BordereauxFormRawValue['createdDate']>;
  updatedDate: FormControl<BordereauxFormRawValue['updatedDate']>;
  createdBy: FormControl<BordereauxFormRawValue['createdBy']>;
  updatedBy: FormControl<BordereauxFormRawValue['updatedBy']>;
  corresps: FormControl<BordereauxFormRawValue['corresps']>;
};

export type BordereauxFormGroup = FormGroup<BordereauxFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class BordereauxFormService {
  createBordereauxFormGroup(bordereaux: BordereauxFormGroupInput = { id: null }): BordereauxFormGroup {
    const bordereauxRawValue = this.convertBordereauxToBordereauxRawValue({
      ...this.getFormDefaults(),
      ...bordereaux,
    });
    return new FormGroup<BordereauxFormGroupContent>({
      id: new FormControl(
        { value: bordereauxRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      reference: new FormControl(bordereauxRawValue.reference, {
        validators: [Validators.required],
      }),
      description: new FormControl(bordereauxRawValue.description),
      amount: new FormControl(bordereauxRawValue.amount, {
        validators: [Validators.required],
      }),
      currency: new FormControl(bordereauxRawValue.currency),
      status: new FormControl(bordereauxRawValue.status, {
        validators: [Validators.required],
      }),
      issuedDate: new FormControl(bordereauxRawValue.issuedDate, {
        validators: [Validators.required],
      }),
      dueDate: new FormControl(bordereauxRawValue.dueDate),
      createdDate: new FormControl(bordereauxRawValue.createdDate),
      updatedDate: new FormControl(bordereauxRawValue.updatedDate),
      createdBy: new FormControl(bordereauxRawValue.createdBy),
      updatedBy: new FormControl(bordereauxRawValue.updatedBy),
      corresps: new FormControl(bordereauxRawValue.corresps ?? []),
    });
  }

  getBordereaux(form: BordereauxFormGroup): IBordereaux | NewBordereaux {
    return this.convertBordereauxRawValueToBordereaux(form.getRawValue() as BordereauxFormRawValue | NewBordereauxFormRawValue);
  }

  resetForm(form: BordereauxFormGroup, bordereaux: BordereauxFormGroupInput): void {
    const bordereauxRawValue = this.convertBordereauxToBordereauxRawValue({ ...this.getFormDefaults(), ...bordereaux });
    form.reset(
      {
        ...bordereauxRawValue,
        id: { value: bordereauxRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): BordereauxFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      issuedDate: currentTime,
      dueDate: currentTime,
      createdDate: currentTime,
      updatedDate: currentTime,
      corresps: [],
    };
  }

  private convertBordereauxRawValueToBordereaux(
    rawBordereaux: BordereauxFormRawValue | NewBordereauxFormRawValue
  ): IBordereaux | NewBordereaux {
    return {
      ...rawBordereaux,
      issuedDate: dayjs(rawBordereaux.issuedDate, DATE_TIME_FORMAT),
      dueDate: dayjs(rawBordereaux.dueDate, DATE_TIME_FORMAT),
      createdDate: dayjs(rawBordereaux.createdDate, DATE_TIME_FORMAT),
      updatedDate: dayjs(rawBordereaux.updatedDate, DATE_TIME_FORMAT),
    };
  }

  private convertBordereauxToBordereauxRawValue(
    bordereaux: IBordereaux | (Partial<NewBordereaux> & BordereauxFormDefaults)
  ): BordereauxFormRawValue | PartialWithRequiredKeyOf<NewBordereauxFormRawValue> {
    return {
      ...bordereaux,
      issuedDate: bordereaux.issuedDate ? bordereaux.issuedDate.format(DATE_TIME_FORMAT) : undefined,
      dueDate: bordereaux.dueDate ? bordereaux.dueDate.format(DATE_TIME_FORMAT) : undefined,
      createdDate: bordereaux.createdDate ? bordereaux.createdDate.format(DATE_TIME_FORMAT) : undefined,
      updatedDate: bordereaux.updatedDate ? bordereaux.updatedDate.format(DATE_TIME_FORMAT) : undefined,
      corresps: bordereaux.corresps ?? [],
    };
  }
}
