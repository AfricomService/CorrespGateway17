import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IPj, NewPj } from '../pj.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IPj for edit and NewPjFormGroupInput for create.
 */
type PjFormGroupInput = IPj | PartialWithRequiredKeyOf<NewPj>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IPj | NewPj> = Omit<T, 'creationDate' | 'updatedDate'> & {
  creationDate?: string | null;
  updatedDate?: string | null;
};

type PjFormRawValue = FormValueOf<IPj>;

type NewPjFormRawValue = FormValueOf<NewPj>;

type PjFormDefaults = Pick<NewPj, 'id' | 'creationDate' | 'transferable' | 'updatedDate' | 'corresps'>;

type PjFormGroupContent = {
  id: FormControl<PjFormRawValue['id'] | NewPj['id']>;
  name: FormControl<PjFormRawValue['name']>;
  fileType: FormControl<PjFormRawValue['fileType']>;
  path: FormControl<PjFormRawValue['path']>;
  creationDate: FormControl<PjFormRawValue['creationDate']>;
  password: FormControl<PjFormRawValue['password']>;
  transferable: FormControl<PjFormRawValue['transferable']>;
  uniqueName: FormControl<PjFormRawValue['uniqueName']>;
  status: FormControl<PjFormRawValue['status']>;
  createdBy: FormControl<PjFormRawValue['createdBy']>;
  updatedBy: FormControl<PjFormRawValue['updatedBy']>;
  updatedDate: FormControl<PjFormRawValue['updatedDate']>;
  corresps: FormControl<PjFormRawValue['corresps']>;
};

export type PjFormGroup = FormGroup<PjFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class PjFormService {
  createPjFormGroup(pj: PjFormGroupInput = { id: null }): PjFormGroup {
    const pjRawValue = this.convertPjToPjRawValue({
      ...this.getFormDefaults(),
      ...pj,
    });
    return new FormGroup<PjFormGroupContent>({
      id: new FormControl(
        { value: pjRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      name: new FormControl(pjRawValue.name),
      fileType: new FormControl(pjRawValue.fileType),
      path: new FormControl(pjRawValue.path),
      creationDate: new FormControl(pjRawValue.creationDate),
      password: new FormControl(pjRawValue.password),
      transferable: new FormControl(pjRawValue.transferable),
      uniqueName: new FormControl(pjRawValue.uniqueName),
      status: new FormControl(pjRawValue.status),
      createdBy: new FormControl(pjRawValue.createdBy),
      updatedBy: new FormControl(pjRawValue.updatedBy),
      updatedDate: new FormControl(pjRawValue.updatedDate),
      corresps: new FormControl(pjRawValue.corresps ?? []),
    });
  }

  getPj(form: PjFormGroup): IPj | NewPj {
    return this.convertPjRawValueToPj(form.getRawValue() as PjFormRawValue | NewPjFormRawValue);
  }

  resetForm(form: PjFormGroup, pj: PjFormGroupInput): void {
    const pjRawValue = this.convertPjToPjRawValue({ ...this.getFormDefaults(), ...pj });
    form.reset(
      {
        ...pjRawValue,
        id: { value: pjRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): PjFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      creationDate: currentTime,
      transferable: false,
      updatedDate: currentTime,
      corresps: [],
    };
  }

  private convertPjRawValueToPj(rawPj: PjFormRawValue | NewPjFormRawValue): IPj | NewPj {
    return {
      ...rawPj,
      creationDate: dayjs(rawPj.creationDate, DATE_TIME_FORMAT),
      updatedDate: dayjs(rawPj.updatedDate, DATE_TIME_FORMAT),
    };
  }

  private convertPjToPjRawValue(pj: IPj | (Partial<NewPj> & PjFormDefaults)): PjFormRawValue | PartialWithRequiredKeyOf<NewPjFormRawValue> {
    return {
      ...pj,
      creationDate: pj.creationDate ? pj.creationDate.format(DATE_TIME_FORMAT) : undefined,
      updatedDate: pj.updatedDate ? pj.updatedDate.format(DATE_TIME_FORMAT) : undefined,
      corresps: pj.corresps ?? [],
    };
  }
}
