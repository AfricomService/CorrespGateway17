import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IPersonCompany, NewPersonCompany } from '../person-company.model';
import { TranslateService } from '@ngx-translate/core';

type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };
type PersonCompanyFormGroupInput = IPersonCompany | PartialWithRequiredKeyOf<NewPersonCompany>;
type PersonCompanyFormDefaults = Pick<NewPersonCompany, 'id' | 'contactCompanyId'>;

type PersonCompanyFormGroupContent = {
  id: FormControl<IPersonCompany['id'] | NewPersonCompany['id']>;
  nom: FormControl<IPersonCompany['nom']>;
  pays: FormControl<IPersonCompany['pays']>;
  adresse: FormControl<IPersonCompany['adresse']>;
  tel: FormControl<IPersonCompany['tel']>;
  fax: FormControl<IPersonCompany['fax']>;
  email: FormControl<IPersonCompany['email']>;
  whatsapp: FormControl<IPersonCompany['whatsapp']>;
  contactCompanyId: FormControl<IPersonCompany['contactCompanyId'] | NewPersonCompany['contactCompanyId']>;
};

export type PersonCompanyFormGroup = FormGroup<PersonCompanyFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class PersonCompanyFormService {
  constructor(private translate: TranslateService) {}

  createPersonCompanyFormGroup(personCompany: PersonCompanyFormGroupInput = { id: null }): PersonCompanyFormGroup {
    const personCompanyRawValue = {
      ...this.getFormDefaults(),
      ...personCompany,
    };
    return new FormGroup<PersonCompanyFormGroupContent>({
      id: new FormControl(
        { value: personCompanyRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      nom: new FormControl(personCompanyRawValue.nom, {
        validators: [Validators.required],
      }),
      pays: new FormControl(personCompanyRawValue.pays),
      adresse: new FormControl(personCompanyRawValue.adresse),
      tel: new FormControl(personCompanyRawValue.tel),
      fax: new FormControl(personCompanyRawValue.fax),
      email: new FormControl(personCompanyRawValue.email, {
        validators: [],
      }),
      whatsapp: new FormControl(personCompanyRawValue.whatsapp),
      contactCompanyId: new FormControl(personCompanyRawValue.contactCompanyId),
    });
  }

  // Méthode utilitaire pour obtenir le message d'erreur traduit pour un contrôle
  getValidationMessage(formControl: FormControl, controlName: string): string {
    if (!formControl) {
      return '';
    }
    if (formControl.hasError('required')) {
      // clé générique (entity.validation.required) est utilisée dans tes templates
      return this.translate.instant('entity.validation.required', { name: controlName });
    }
    if (formControl.hasError('email')) {
      return this.translate.instant('entity.validation.email');
    }
    if (formControl.hasError('nameExists')) {
      // clé spécifique à ajouter dans ton i18n si nécessaire
      return this.translate.instant('correspCareApp.configManagePersonCompany.messages.nameExists');
    }
    return '';
  }

  getPersonCompany(form: PersonCompanyFormGroup): IPersonCompany | NewPersonCompany {
    return form.getRawValue() as IPersonCompany | NewPersonCompany;
  }

  resetForm(form: PersonCompanyFormGroup, personCompany: PersonCompanyFormGroupInput): void {
    const personCompanyRawValue = { ...this.getFormDefaults(), ...personCompany };
    form.reset({
      ...personCompanyRawValue,
      id: { value: personCompanyRawValue.id, disabled: true },
    } as any);
  }

  private getFormDefaults(): PersonCompanyFormDefaults {
    return {
      id: null,
      contactCompanyId: null,
    };
  }
}
