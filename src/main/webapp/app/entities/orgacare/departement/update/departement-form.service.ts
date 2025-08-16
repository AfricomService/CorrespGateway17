import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IDepartement, NewDepartement } from '../departement.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IDepartement for edit and NewDepartementFormGroupInput for create.
 */
type DepartementFormGroupInput = IDepartement | PartialWithRequiredKeyOf<NewDepartement>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IDepartement | NewDepartement> = Omit<T, 'createdDate' | 'updatedDate'> & {
  createdDate?: string | null;
  updatedDate?: string | null;
};

type DepartementFormRawValue = FormValueOf<IDepartement>;

type NewDepartementFormRawValue = FormValueOf<NewDepartement>;

type DepartementFormDefaults = Pick<NewDepartement, 'id' | 'createdDate' | 'updatedDate'>;

type DepartementFormGroupContent = {
  id: FormControl<DepartementFormRawValue['id'] | NewDepartement['id']>;
  code: FormControl<DepartementFormRawValue['code']>;
  name: FormControl<DepartementFormRawValue['name']>;
  description: FormControl<DepartementFormRawValue['description']>;
  createdDate: FormControl<DepartementFormRawValue['createdDate']>;
  updatedDate: FormControl<DepartementFormRawValue['updatedDate']>;
};

export type DepartementFormGroup = FormGroup<DepartementFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class DepartementFormService {
  createDepartementFormGroup(departement: DepartementFormGroupInput = { id: null }): DepartementFormGroup {
    const departementRawValue = this.convertDepartementToDepartementRawValue({
      ...this.getFormDefaults(),
      ...departement,
    });
    return new FormGroup<DepartementFormGroupContent>({
      id: new FormControl(
        { value: departementRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      code: new FormControl(departementRawValue.code, {
        validators: [Validators.required],
      }),
      name: new FormControl(departementRawValue.name, {
        validators: [Validators.required],
      }),
      description: new FormControl(departementRawValue.description),
      createdDate: new FormControl(departementRawValue.createdDate),
      updatedDate: new FormControl(departementRawValue.updatedDate),
    });
  }

  getDepartement(form: DepartementFormGroup): IDepartement | NewDepartement {
    return this.convertDepartementRawValueToDepartement(form.getRawValue() as DepartementFormRawValue | NewDepartementFormRawValue);
  }

  resetForm(form: DepartementFormGroup, departement: DepartementFormGroupInput): void {
    const departementRawValue = this.convertDepartementToDepartementRawValue({ ...this.getFormDefaults(), ...departement });
    form.reset(
      {
        ...departementRawValue,
        id: { value: departementRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): DepartementFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      createdDate: currentTime,
      updatedDate: currentTime,
    };
  }

  private convertDepartementRawValueToDepartement(
    rawDepartement: DepartementFormRawValue | NewDepartementFormRawValue
  ): IDepartement | NewDepartement {
    return {
      ...rawDepartement,
      createdDate: dayjs(rawDepartement.createdDate, DATE_TIME_FORMAT),
      updatedDate: dayjs(rawDepartement.updatedDate, DATE_TIME_FORMAT),
    };
  }

  private convertDepartementToDepartementRawValue(
    departement: IDepartement | (Partial<NewDepartement> & DepartementFormDefaults)
  ): DepartementFormRawValue | PartialWithRequiredKeyOf<NewDepartementFormRawValue> {
    return {
      ...departement,
      createdDate: departement.createdDate ? departement.createdDate.format(DATE_TIME_FORMAT) : undefined,
      updatedDate: departement.updatedDate ? departement.updatedDate.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
