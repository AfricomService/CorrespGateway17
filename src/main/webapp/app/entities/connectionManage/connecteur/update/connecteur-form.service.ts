import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IConnecteur, NewConnecteur } from '../connecteur.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IConnecteur for edit and NewConnecteurFormGroupInput for create.
 */
type ConnecteurFormGroupInput = IConnecteur | PartialWithRequiredKeyOf<NewConnecteur>;

type ConnecteurFormDefaults = Pick<NewConnecteur, 'id' | 'isActif'>;

type ConnecteurFormGroupContent = {
  id: FormControl<IConnecteur['id'] | NewConnecteur['id']>;
  name: FormControl<IConnecteur['name']>;
  codeRules: FormControl<IConnecteur['codeRules']>;
  protocol: FormControl<IConnecteur['protocol']>;
  host: FormControl<IConnecteur['host']>;
  port: FormControl<IConnecteur['port']>;
  enable: FormControl<IConnecteur['enable']>;
  email: FormControl<IConnecteur['email']>;
  password: FormControl<IConnecteur['password']>;
  folderSource: FormControl<IConnecteur['folderSource']>;
  folderonOK: FormControl<IConnecteur['folderonOK']>;
  folderonError: FormControl<IConnecteur['folderonError']>;
  isActif: FormControl<IConnecteur['isActif']>;
};

export type ConnecteurFormGroup = FormGroup<ConnecteurFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ConnecteurFormService {
  createConnecteurFormGroup(connecteur: ConnecteurFormGroupInput = { id: null }): ConnecteurFormGroup {
    const connecteurRawValue = {
      ...this.getFormDefaults(),
      ...connecteur,
    };
    return new FormGroup<ConnecteurFormGroupContent>({
      id: new FormControl(
        { value: connecteurRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      name: new FormControl(connecteurRawValue.name),
      codeRules: new FormControl(connecteurRawValue.codeRules),
      protocol: new FormControl(connecteurRawValue.protocol),
      host: new FormControl(connecteurRawValue.host),
      port: new FormControl(connecteurRawValue.port),
      enable: new FormControl(connecteurRawValue.enable),
      email: new FormControl(connecteurRawValue.email),
      password: new FormControl(connecteurRawValue.password),
      folderSource: new FormControl(connecteurRawValue.folderSource),
      folderonOK: new FormControl(connecteurRawValue.folderonOK),
      folderonError: new FormControl(connecteurRawValue.folderonError),
      isActif: new FormControl(connecteurRawValue.isActif),
    });
  }

  getConnecteur(form: ConnecteurFormGroup): IConnecteur | NewConnecteur {
    return form.getRawValue() as IConnecteur | NewConnecteur;
  }

  resetForm(form: ConnecteurFormGroup, connecteur: ConnecteurFormGroupInput): void {
    const connecteurRawValue = { ...this.getFormDefaults(), ...connecteur };
    form.reset(
      {
        ...connecteurRawValue,
        id: { value: connecteurRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): ConnecteurFormDefaults {
    return {
      id: null,
      isActif: false,
    };
  }
}
