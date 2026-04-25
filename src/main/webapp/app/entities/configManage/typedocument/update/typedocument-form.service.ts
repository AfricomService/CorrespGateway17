import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ITypedocument, NewTypedocument } from '../typedocument.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ITypedocument for edit and NewTypedocumentFormGroupInput for create.
 */
type TypedocumentFormGroupInput = ITypedocument | PartialWithRequiredKeyOf<NewTypedocument>;

type TypedocumentFormDefaults = Pick<NewTypedocument, 'id'>;

type TypedocumentFormGroupContent = {
  id: FormControl<ITypedocument['id'] | NewTypedocument['id']>;
  nom: FormControl<ITypedocument['nom']>;
  defautdest: FormControl<ITypedocument['defautdest']>;
  defaultobject: FormControl<ITypedocument['defaultobject']>;
  defaultencopie: FormControl<ITypedocument['defaultencopie']>;
  usualstatus: FormControl<ITypedocument['usualstatus']>;
  labelDCC: FormControl<ITypedocument['labelDCC']>;
  labelDD: FormControl<ITypedocument['labelDD']>;
  correspType: FormControl<ITypedocument['correspType']>;
  codeUniqueSociete: FormControl<ITypedocument['codeUniqueSociete']>;
};

export type TypedocumentFormGroup = FormGroup<TypedocumentFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class TypedocumentFormService {
  createTypedocumentFormGroup(typedocument: TypedocumentFormGroupInput = { id: null }): TypedocumentFormGroup {
    const typedocumentRawValue = {
      ...this.getFormDefaults(),
      ...typedocument,
    };
    return new FormGroup<TypedocumentFormGroupContent>({
      id: new FormControl(
        { value: typedocumentRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      nom: new FormControl(typedocumentRawValue.nom),
      defautdest: new FormControl(typedocumentRawValue.defautdest),
      defaultobject: new FormControl(typedocumentRawValue.defaultobject),
      defaultencopie: new FormControl(typedocumentRawValue.defaultencopie),
      usualstatus: new FormControl(typedocumentRawValue.usualstatus),
      labelDCC: new FormControl(typedocumentRawValue.labelDCC),
      labelDD: new FormControl(typedocumentRawValue.labelDD),
      correspType: new FormControl(typedocumentRawValue.correspType),
      codeUniqueSociete: new FormControl(typedocumentRawValue.codeUniqueSociete),
    });
  }

  getTypedocument(form: TypedocumentFormGroup): ITypedocument | NewTypedocument {
    return form.getRawValue() as ITypedocument | NewTypedocument;
  }

  resetForm(form: TypedocumentFormGroup, typedocument: TypedocumentFormGroupInput): void {
    const typedocumentRawValue = { ...this.getFormDefaults(), ...typedocument };
    form.reset(
      {
        ...typedocumentRawValue,
        id: { value: typedocumentRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): TypedocumentFormDefaults {
    return {
      id: null,
    };
  }
}
