import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IParentClassdef, NewParentClassdef } from '../parent-classdef.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IParentClassdef for edit and NewParentClassdefFormGroupInput for create.
 */
type ParentClassdefFormGroupInput = IParentClassdef | PartialWithRequiredKeyOf<NewParentClassdef>;

type ParentClassdefFormDefaults = Pick<NewParentClassdef, 'id'>;

type ParentClassdefFormGroupContent = {
  id: FormControl<IParentClassdef['id'] | NewParentClassdef['id']>;
  type: FormControl<IParentClassdef['type']>;
  sequenceId: FormControl<IParentClassdef['sequenceId']>;
};

export type ParentClassdefFormGroup = FormGroup<ParentClassdefFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ParentClassdefFormService {
  createParentClassdefFormGroup(parentClassdef: ParentClassdefFormGroupInput = { id: null }): ParentClassdefFormGroup {
    const parentClassdefRawValue = {
      ...this.getFormDefaults(),
      ...parentClassdef,
    };
    return new FormGroup<ParentClassdefFormGroupContent>({
      id: new FormControl(
        { value: parentClassdefRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      type: new FormControl(parentClassdefRawValue.type),
      sequenceId: new FormControl(parentClassdefRawValue.sequenceId),
    });
  }

  getParentClassdef(form: ParentClassdefFormGroup): IParentClassdef | NewParentClassdef {
    return form.getRawValue() as IParentClassdef | NewParentClassdef;
  }

  resetForm(form: ParentClassdefFormGroup, parentClassdef: ParentClassdefFormGroupInput): void {
    const parentClassdefRawValue = { ...this.getFormDefaults(), ...parentClassdef };
    form.reset(
      {
        ...parentClassdefRawValue,
        id: { value: parentClassdefRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): ParentClassdefFormDefaults {
    return {
      id: null,
    };
  }
}
