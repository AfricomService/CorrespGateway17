import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IRules, NewRules } from '../rules.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IRules for edit and NewRulesFormGroupInput for create.
 */
type RulesFormGroupInput = IRules | PartialWithRequiredKeyOf<NewRules>;

type RulesFormDefaults = Pick<NewRules, 'id' | 'isActif'>;

type RulesFormGroupContent = {
  id: FormControl<IRules['id'] | NewRules['id']>;
  name: FormControl<IRules['name']>;
  code: FormControl<IRules['code']>;
  isActif: FormControl<IRules['isActif']>;
  file: FormControl<IRules['file']>;
  fileContentType: FormControl<IRules['fileContentType']>;
};

export type RulesFormGroup = FormGroup<RulesFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class RulesFormService {
  createRulesFormGroup(rules: RulesFormGroupInput = { id: null }): RulesFormGroup {
    const rulesRawValue = {
      ...this.getFormDefaults(),
      ...rules,
    };
    return new FormGroup<RulesFormGroupContent>({
      id: new FormControl(
        { value: rulesRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      name: new FormControl(rulesRawValue.name),
      code: new FormControl(rulesRawValue.code),
      isActif: new FormControl(rulesRawValue.isActif),
      file: new FormControl(rulesRawValue.file),
      fileContentType: new FormControl(rulesRawValue.fileContentType),
    });
  }

  getRules(form: RulesFormGroup): IRules | NewRules {
    return form.getRawValue() as IRules | NewRules;
  }

  resetForm(form: RulesFormGroup, rules: RulesFormGroupInput): void {
    const rulesRawValue = { ...this.getFormDefaults(), ...rules };
    form.reset(
      {
        ...rulesRawValue,
        id: { value: rulesRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): RulesFormDefaults {
    return {
      id: null,
      isActif: false,
    };
  }
}
