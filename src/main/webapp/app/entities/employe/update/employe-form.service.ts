import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IEmploye, NewEmploye } from '../employe.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IEmploye for edit and NewEmployeFormGroupInput for create.
 */
type EmployeFormGroupInput = IEmploye | PartialWithRequiredKeyOf<NewEmploye>;

type EmployeFormDefaults = Pick<NewEmploye, 'id'>;

type EmployeFormGroupContent = {
  id: FormControl<IEmploye['id'] | NewEmploye['id']>;
  jobTitle: FormControl<IEmploye['jobTitle']>;
  email: FormControl<IEmploye['email']>;
  phoneNumber: FormControl<IEmploye['phoneNumber']>;
};

export type EmployeFormGroup = FormGroup<EmployeFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class EmployeFormService {
  createEmployeFormGroup(employe: EmployeFormGroupInput = { id: null }): EmployeFormGroup {
    const employeRawValue = {
      ...this.getFormDefaults(),
      ...employe,
    };
    return new FormGroup<EmployeFormGroupContent>({
      id: new FormControl(
        { value: employeRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      jobTitle: new FormControl(employeRawValue.jobTitle),
      email: new FormControl(employeRawValue.email),
      phoneNumber: new FormControl(employeRawValue.phoneNumber),
    });
  }

  getEmploye(form: EmployeFormGroup): IEmploye | NewEmploye {
    return form.getRawValue() as IEmploye | NewEmploye;
  }

  resetForm(form: EmployeFormGroup, employe: EmployeFormGroupInput): void {
    const employeRawValue = { ...this.getFormDefaults(), ...employe };
    form.reset(
      {
        ...employeRawValue,
        id: { value: employeRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): EmployeFormDefaults {
    return {
      id: null,
    };
  }
}
