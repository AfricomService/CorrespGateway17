import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ISmtpConfig, NewSmtpConfig } from '../smtp-config.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ISmtpConfig for edit and NewSmtpConfigFormGroupInput for create.
 */
type SmtpConfigFormGroupInput = ISmtpConfig | PartialWithRequiredKeyOf<NewSmtpConfig>;

type SmtpConfigFormDefaults = Pick<NewSmtpConfig, 'id' | 'useAuth' | 'useTls' | 'useSsl' | 'active'>;

type SmtpConfigFormGroupContent = {
  id: FormControl<ISmtpConfig['id'] | NewSmtpConfig['id']>;
  name: FormControl<ISmtpConfig['name']>;
  smtpHost: FormControl<ISmtpConfig['smtpHost']>;
  smtpPort: FormControl<ISmtpConfig['smtpPort']>;
  username: FormControl<ISmtpConfig['username']>;
  password: FormControl<ISmtpConfig['password']>;
  useAuth: FormControl<ISmtpConfig['useAuth']>;
  useTls: FormControl<ISmtpConfig['useTls']>;
  useSsl: FormControl<ISmtpConfig['useSsl']>;
  fromAddress: FormControl<ISmtpConfig['fromAddress']>;
  fromName: FormControl<ISmtpConfig['fromName']>;
  lacalhostName: FormControl<ISmtpConfig['lacalhostName']>;
  connectionTimeout: FormControl<ISmtpConfig['connectionTimeout']>;
  timeout: FormControl<ISmtpConfig['timeout']>;
  active: FormControl<ISmtpConfig['active']>;
  description: FormControl<ISmtpConfig['description']>;
};

export type SmtpConfigFormGroup = FormGroup<SmtpConfigFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class SmtpConfigFormService {
  createSmtpConfigFormGroup(smtpConfig: SmtpConfigFormGroupInput = { id: null }): SmtpConfigFormGroup {
    const smtpConfigRawValue = {
      ...this.getFormDefaults(),
      ...smtpConfig,
    };
    return new FormGroup<SmtpConfigFormGroupContent>({
      id: new FormControl(
        { value: smtpConfigRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      name: new FormControl(smtpConfigRawValue.name),
      smtpHost: new FormControl(smtpConfigRawValue.smtpHost),
      smtpPort: new FormControl(smtpConfigRawValue.smtpPort),
      username: new FormControl(smtpConfigRawValue.username),
      password: new FormControl(smtpConfigRawValue.password),
      useAuth: new FormControl(smtpConfigRawValue.useAuth),
      useTls: new FormControl(smtpConfigRawValue.useTls),
      useSsl: new FormControl(smtpConfigRawValue.useSsl),
      fromAddress: new FormControl(smtpConfigRawValue.fromAddress),
      fromName: new FormControl(smtpConfigRawValue.fromName),
      lacalhostName: new FormControl(smtpConfigRawValue.lacalhostName),
      connectionTimeout: new FormControl(smtpConfigRawValue.connectionTimeout),
      timeout: new FormControl(smtpConfigRawValue.timeout),
      active: new FormControl(smtpConfigRawValue.active),
      description: new FormControl(smtpConfigRawValue.description),
    });
  }

  getSmtpConfig(form: SmtpConfigFormGroup): ISmtpConfig | NewSmtpConfig {
    return form.getRawValue() as ISmtpConfig | NewSmtpConfig;
  }

  resetForm(form: SmtpConfigFormGroup, smtpConfig: SmtpConfigFormGroupInput): void {
    const smtpConfigRawValue = { ...this.getFormDefaults(), ...smtpConfig };
    form.reset(
      {
        ...smtpConfigRawValue,
        id: { value: smtpConfigRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): SmtpConfigFormDefaults {
    return {
      id: null,
      useAuth: false,
      useTls: false,
      useSsl: false,
      active: false,
    };
  }
}
