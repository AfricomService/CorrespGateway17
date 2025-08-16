import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IDossier, NewDossier } from '../dossier.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IDossier for edit and NewDossierFormGroupInput for create.
 */
type DossierFormGroupInput = IDossier | PartialWithRequiredKeyOf<NewDossier>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IDossier | NewDossier> = Omit<T, 'updatedDate'> & {
  updatedDate?: string | null;
};

type DossierFormRawValue = FormValueOf<IDossier>;

type NewDossierFormRawValue = FormValueOf<NewDossier>;

type DossierFormDefaults = Pick<NewDossier, 'id' | 'isPublic' | 'updatedDate' | 'corresps'>;

type DossierFormGroupContent = {
  id: FormControl<DossierFormRawValue['id'] | NewDossier['id']>;
  name: FormControl<DossierFormRawValue['name']>;
  isPublic: FormControl<DossierFormRawValue['isPublic']>;
  responsible: FormControl<DossierFormRawValue['responsible']>;
  status: FormControl<DossierFormRawValue['status']>;
  dossierList: FormControl<DossierFormRawValue['dossierList']>;
  dossierListContentType: FormControl<DossierFormRawValue['dossierListContentType']>;
  createdBy: FormControl<DossierFormRawValue['createdBy']>;
  updatedBy: FormControl<DossierFormRawValue['updatedBy']>;
  updatedDate: FormControl<DossierFormRawValue['updatedDate']>;
  corresps: FormControl<DossierFormRawValue['corresps']>;
};

export type DossierFormGroup = FormGroup<DossierFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class DossierFormService {
  createDossierFormGroup(dossier: DossierFormGroupInput = { id: null }): DossierFormGroup {
    const dossierRawValue = this.convertDossierToDossierRawValue({
      ...this.getFormDefaults(),
      ...dossier,
    });
    return new FormGroup<DossierFormGroupContent>({
      id: new FormControl(
        { value: dossierRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      name: new FormControl(dossierRawValue.name),
      isPublic: new FormControl(dossierRawValue.isPublic),
      responsible: new FormControl(dossierRawValue.responsible),
      status: new FormControl(dossierRawValue.status),
      dossierList: new FormControl(dossierRawValue.dossierList),
      dossierListContentType: new FormControl(dossierRawValue.dossierListContentType),
      createdBy: new FormControl(dossierRawValue.createdBy),
      updatedBy: new FormControl(dossierRawValue.updatedBy),
      updatedDate: new FormControl(dossierRawValue.updatedDate),
      corresps: new FormControl(dossierRawValue.corresps ?? []),
    });
  }

  getDossier(form: DossierFormGroup): IDossier | NewDossier {
    return this.convertDossierRawValueToDossier(form.getRawValue() as DossierFormRawValue | NewDossierFormRawValue);
  }

  resetForm(form: DossierFormGroup, dossier: DossierFormGroupInput): void {
    const dossierRawValue = this.convertDossierToDossierRawValue({ ...this.getFormDefaults(), ...dossier });
    form.reset(
      {
        ...dossierRawValue,
        id: { value: dossierRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): DossierFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      isPublic: false,
      updatedDate: currentTime,
      corresps: [],
    };
  }

  private convertDossierRawValueToDossier(rawDossier: DossierFormRawValue | NewDossierFormRawValue): IDossier | NewDossier {
    return {
      ...rawDossier,
      updatedDate: dayjs(rawDossier.updatedDate, DATE_TIME_FORMAT),
    };
  }

  private convertDossierToDossierRawValue(
    dossier: IDossier | (Partial<NewDossier> & DossierFormDefaults)
  ): DossierFormRawValue | PartialWithRequiredKeyOf<NewDossierFormRawValue> {
    return {
      ...dossier,
      updatedDate: dossier.updatedDate ? dossier.updatedDate.format(DATE_TIME_FORMAT) : undefined,
      corresps: dossier.corresps ?? [],
    };
  }
}
