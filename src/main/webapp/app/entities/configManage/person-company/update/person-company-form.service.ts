import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IPersonCompany, NewPersonCompany } from '../person-company.model';
import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IPersonCompany for edit and NewPersonCompanyFormGroupInput for create.
 */
type PersonCompanyFormGroupInput = IPersonCompany | PartialWithRequiredKeyOf<NewPersonCompany>;

// Ajouter contactCompanyId et etat aux defaults
type PersonCompanyFormDefaults = Pick<NewPersonCompany, 'id' | 'contactCompanyId' | 'etat'>;

type PersonCompanyFormGroupContent = {
  id: FormControl<IPersonCompany['id'] | NewPersonCompany['id']>;
  nom: FormControl<IPersonCompany['nom']>;
  pays: FormControl<IPersonCompany['pays']>;
  adresse: FormControl<IPersonCompany['adresse']>;
  tel: FormControl<IPersonCompany['tel']>;
  fax: FormControl<IPersonCompany['fax']>;
  email: FormControl<IPersonCompany['email']>;
  whatsapp: FormControl<IPersonCompany['whatsapp']>;
  etat: FormControl<IPersonCompany['etat']>;
  // nouveau contrôle typé
  contactCompanyId: FormControl<IPersonCompany['contactCompanyId'] | NewPersonCompany['contactCompanyId']>;
};

export type PersonCompanyFormGroup = FormGroup<PersonCompanyFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class PersonCompanyFormService {
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
      email: new FormControl(personCompanyRawValue.email),
      whatsapp: new FormControl(personCompanyRawValue.whatsapp),
      etat: new FormControl(personCompanyRawValue.etat),
      // ajout du contrôle contactCompanyId
      contactCompanyId: new FormControl(personCompanyRawValue.contactCompanyId),
    });
  }

  getPersonCompany(form: PersonCompanyFormGroup): IPersonCompany | NewPersonCompany {
    return form.getRawValue() as IPersonCompany | NewPersonCompany;
  }

  resetForm(form: PersonCompanyFormGroup, personCompany: PersonCompanyFormGroupInput): void {
    const personCompanyRawValue = { ...this.getFormDefaults(), ...personCompany };
    form.reset(
      {
        ...personCompanyRawValue,
        id: { value: personCompanyRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): PersonCompanyFormDefaults {
    return {
      id: null,
      contactCompanyId: null,
      // Utiliser la valeur existante dans l'enum
      etat: UsualStatus.Actif,
    };
  }
}
