import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { INumsequentielle, NewNumsequentielle } from '../numsequentielle.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts INumsequentielle for edit and NewNumsequentielleFormGroupInput for create.
 */
type NumsequentielleFormGroupInput = INumsequentielle | PartialWithRequiredKeyOf<NewNumsequentielle>;

type NumsequentielleFormDefaults = Pick<NewNumsequentielle, 'id'>;

type NumsequentielleFormGroupContent = {
  id: FormControl<INumsequentielle['id'] | NewNumsequentielle['id']>;
  prefix: FormControl<INumsequentielle['prefix']>;
  nextNumber: FormControl<INumsequentielle['nextNumber']>;
  format: FormControl<INumsequentielle['format']>;
  codeNumSeq: FormControl<INumsequentielle['codeNumSeq']>;
};

export type NumsequentielleFormGroup = FormGroup<NumsequentielleFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class NumsequentielleFormService {
  createNumsequentielleFormGroup(numsequentielle: NumsequentielleFormGroupInput = { id: null }): NumsequentielleFormGroup {
    const numsequentielleRawValue = {
      ...this.getFormDefaults(),
      ...numsequentielle,
    };
    return new FormGroup<NumsequentielleFormGroupContent>({
      id: new FormControl({ value: numsequentielleRawValue.id, disabled: true }, { nonNullable: true, validators: [Validators.required] }),
      prefix: new FormControl(numsequentielleRawValue.prefix),
      nextNumber: new FormControl(numsequentielleRawValue.nextNumber, {
        validators: [Validators.required],
      }),
      format: new FormControl(numsequentielleRawValue.format),
      codeNumSeq: new FormControl(numsequentielleRawValue.codeNumSeq),
    });
  }

  getNumsequentielle(form: NumsequentielleFormGroup): INumsequentielle | NewNumsequentielle {
    return form.getRawValue() as INumsequentielle | NewNumsequentielle;
  }

  resetForm(form: NumsequentielleFormGroup, numsequentielle: NumsequentielleFormGroupInput): void {
    const numsequentielleRawValue = { ...this.getFormDefaults(), ...numsequentielle };
    form.reset(
      {
        ...numsequentielleRawValue,
        id: { value: numsequentielleRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): NumsequentielleFormDefaults {
    return {
      id: null,
    };
  }
}
