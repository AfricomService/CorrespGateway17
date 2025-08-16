import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IOrgaEntity, NewOrgaEntity } from '../orga-entity.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IOrgaEntity for edit and NewOrgaEntityFormGroupInput for create.
 */
type OrgaEntityFormGroupInput = IOrgaEntity | PartialWithRequiredKeyOf<NewOrgaEntity>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IOrgaEntity | NewOrgaEntity> = Omit<T, 'createdDate' | 'updatedDate'> & {
  createdDate?: string | null;
  updatedDate?: string | null;
};

type OrgaEntityFormRawValue = FormValueOf<IOrgaEntity>;

type NewOrgaEntityFormRawValue = FormValueOf<NewOrgaEntity>;

type OrgaEntityFormDefaults = Pick<NewOrgaEntity, 'id' | 'createdDate' | 'updatedDate'>;

type OrgaEntityFormGroupContent = {
  id: FormControl<OrgaEntityFormRawValue['id'] | NewOrgaEntity['id']>;
  name: FormControl<OrgaEntityFormRawValue['name']>;
  description: FormControl<OrgaEntityFormRawValue['description']>;
  createdDate: FormControl<OrgaEntityFormRawValue['createdDate']>;
  updatedDate: FormControl<OrgaEntityFormRawValue['updatedDate']>;
  departement: FormControl<OrgaEntityFormRawValue['departement']>;
  employe: FormControl<OrgaEntityFormRawValue['employe']>;
};

export type OrgaEntityFormGroup = FormGroup<OrgaEntityFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class OrgaEntityFormService {
  createOrgaEntityFormGroup(orgaEntity: OrgaEntityFormGroupInput = { id: null }): OrgaEntityFormGroup {
    const orgaEntityRawValue = this.convertOrgaEntityToOrgaEntityRawValue({
      ...this.getFormDefaults(),
      ...orgaEntity,
    });
    return new FormGroup<OrgaEntityFormGroupContent>({
      id: new FormControl(
        { value: orgaEntityRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      name: new FormControl(orgaEntityRawValue.name, {
        validators: [Validators.required],
      }),
      description: new FormControl(orgaEntityRawValue.description),
      createdDate: new FormControl(orgaEntityRawValue.createdDate),
      updatedDate: new FormControl(orgaEntityRawValue.updatedDate),
      departement: new FormControl(orgaEntityRawValue.departement),
      employe: new FormControl(orgaEntityRawValue.employe),
    });
  }

  getOrgaEntity(form: OrgaEntityFormGroup): IOrgaEntity | NewOrgaEntity {
    return this.convertOrgaEntityRawValueToOrgaEntity(form.getRawValue() as OrgaEntityFormRawValue | NewOrgaEntityFormRawValue);
  }

  resetForm(form: OrgaEntityFormGroup, orgaEntity: OrgaEntityFormGroupInput): void {
    const orgaEntityRawValue = this.convertOrgaEntityToOrgaEntityRawValue({ ...this.getFormDefaults(), ...orgaEntity });
    form.reset(
      {
        ...orgaEntityRawValue,
        id: { value: orgaEntityRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): OrgaEntityFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      createdDate: currentTime,
      updatedDate: currentTime,
    };
  }

  private convertOrgaEntityRawValueToOrgaEntity(
    rawOrgaEntity: OrgaEntityFormRawValue | NewOrgaEntityFormRawValue
  ): IOrgaEntity | NewOrgaEntity {
    return {
      ...rawOrgaEntity,
      createdDate: dayjs(rawOrgaEntity.createdDate, DATE_TIME_FORMAT),
      updatedDate: dayjs(rawOrgaEntity.updatedDate, DATE_TIME_FORMAT),
    };
  }

  private convertOrgaEntityToOrgaEntityRawValue(
    orgaEntity: IOrgaEntity | (Partial<NewOrgaEntity> & OrgaEntityFormDefaults)
  ): OrgaEntityFormRawValue | PartialWithRequiredKeyOf<NewOrgaEntityFormRawValue> {
    return {
      ...orgaEntity,
      createdDate: orgaEntity.createdDate ? orgaEntity.createdDate.format(DATE_TIME_FORMAT) : undefined,
      updatedDate: orgaEntity.updatedDate ? orgaEntity.updatedDate.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
