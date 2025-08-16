import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IConfigexport, NewConfigexport } from '../configexport.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IConfigexport for edit and NewConfigexportFormGroupInput for create.
 */
type ConfigexportFormGroupInput = IConfigexport | PartialWithRequiredKeyOf<NewConfigexport>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IConfigexport | NewConfigexport> = Omit<T, 'dateCreated'> & {
  dateCreated?: string | null;
};

type ConfigexportFormRawValue = FormValueOf<IConfigexport>;

type NewConfigexportFormRawValue = FormValueOf<NewConfigexport>;

type ConfigexportFormDefaults = Pick<NewConfigexport, 'id' | 'active' | 'dateCreated'>;

type ConfigexportFormGroupContent = {
  id: FormControl<ConfigexportFormRawValue['id'] | NewConfigexport['id']>;
  label: FormControl<ConfigexportFormRawValue['label']>;
  active: FormControl<ConfigexportFormRawValue['active']>;
  excelFile: FormControl<ConfigexportFormRawValue['excelFile']>;
  excelFileContentType: FormControl<ConfigexportFormRawValue['excelFileContentType']>;
  dateCreated: FormControl<ConfigexportFormRawValue['dateCreated']>;
  configMappingJson: FormControl<ConfigexportFormRawValue['configMappingJson']>;
  readAccess: FormControl<ConfigexportFormRawValue['readAccess']>;
};

export type ConfigexportFormGroup = FormGroup<ConfigexportFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ConfigexportFormService {
  createConfigexportFormGroup(configexport: ConfigexportFormGroupInput = { id: null }): ConfigexportFormGroup {
    const configexportRawValue = this.convertConfigexportToConfigexportRawValue({
      ...this.getFormDefaults(),
      ...configexport,
    });
    return new FormGroup<ConfigexportFormGroupContent>({
      id: new FormControl(
        { value: configexportRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      label: new FormControl(configexportRawValue.label),
      active: new FormControl(configexportRawValue.active),
      excelFile: new FormControl(configexportRawValue.excelFile),
      excelFileContentType: new FormControl(configexportRawValue.excelFileContentType),
      dateCreated: new FormControl(configexportRawValue.dateCreated),
      configMappingJson: new FormControl(configexportRawValue.configMappingJson),
      readAccess: new FormControl(configexportRawValue.readAccess),
    });
  }

  getConfigexport(form: ConfigexportFormGroup): IConfigexport | NewConfigexport {
    return this.convertConfigexportRawValueToConfigexport(form.getRawValue() as ConfigexportFormRawValue | NewConfigexportFormRawValue);
  }

  resetForm(form: ConfigexportFormGroup, configexport: ConfigexportFormGroupInput): void {
    const configexportRawValue = this.convertConfigexportToConfigexportRawValue({ ...this.getFormDefaults(), ...configexport });
    form.reset(
      {
        ...configexportRawValue,
        id: { value: configexportRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): ConfigexportFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      active: false,
      dateCreated: currentTime,
    };
  }

  private convertConfigexportRawValueToConfigexport(
    rawConfigexport: ConfigexportFormRawValue | NewConfigexportFormRawValue
  ): IConfigexport | NewConfigexport {
    return {
      ...rawConfigexport,
      dateCreated: dayjs(rawConfigexport.dateCreated, DATE_TIME_FORMAT),
    };
  }

  private convertConfigexportToConfigexportRawValue(
    configexport: IConfigexport | (Partial<NewConfigexport> & ConfigexportFormDefaults)
  ): ConfigexportFormRawValue | PartialWithRequiredKeyOf<NewConfigexportFormRawValue> {
    return {
      ...configexport,
      dateCreated: configexport.dateCreated ? configexport.dateCreated.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
