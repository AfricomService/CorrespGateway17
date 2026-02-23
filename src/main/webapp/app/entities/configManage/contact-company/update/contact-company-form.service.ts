import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { IContactCompany, NewContactCompany } from '../contact-company.model';
import { TranslateService } from '@ngx-translate/core'; // Importez TranslateService

type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };
type ContactCompanyFormGroupInput = IContactCompany | PartialWithRequiredKeyOf<NewContactCompany>;
type ContactCompanyFormDefaults = Pick<NewContactCompany, 'id'>;

type ContactCompanyFormGroupContent = {
  id: FormControl<IContactCompany['id'] | NewContactCompany['id']>;
  nom: FormControl<IContactCompany['nom']>;
  nomabrege: FormControl<IContactCompany['nomabrege']>;
  matrne: FormControl<IContactCompany['matrne']>;
  pays: FormControl<IContactCompany['pays']>;
  adresse: FormControl<IContactCompany['adresse']>;
  tel: FormControl<IContactCompany['tel']>;
  fax: FormControl<IContactCompany['fax']>;
  email: FormControl<IContactCompany['email']>;
  webpage: FormControl<IContactCompany['webpage']>;
};

export type ContactCompanyFormGroup = FormGroup<ContactCompanyFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ContactCompanyFormService {
  constructor(private translate: TranslateService) {} // Injectez TranslateService

  createContactCompanyFormGroup(contactCompany: ContactCompanyFormGroupInput = { id: null }): ContactCompanyFormGroup {
    const contactCompanyRawValue = {
      ...this.getFormDefaults(),
      ...contactCompany,
    };
    return new FormGroup<ContactCompanyFormGroupContent>({
      id: new FormControl(
        { value: contactCompanyRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      nom: new FormControl(contactCompanyRawValue.nom, {
        validators: [Validators.required],
      }),
      nomabrege: new FormControl(contactCompanyRawValue.nomabrege),
      matrne: new FormControl(contactCompanyRawValue.matrne),
      pays: new FormControl(contactCompanyRawValue.pays),
      adresse: new FormControl(contactCompanyRawValue.adresse),
      tel: new FormControl(contactCompanyRawValue.tel),
      fax: new FormControl(contactCompanyRawValue.fax),
      email: new FormControl(contactCompanyRawValue.email),
      webpage: new FormControl(contactCompanyRawValue.webpage),
    });
  }

  // Exemple de gestion des messages d'erreur traduits pour les champs obligatoires
  getValidationMessage(formControl: FormControl, controlName: string): string {
    if (formControl.hasError('required')) {
      return this.translate.instant('entity.validation.required', { name: controlName });
    }
    // Vous pouvez ajouter d'autres validations comme email, unique, etc.
    return '';
  }

  getContactCompany(form: ContactCompanyFormGroup): IContactCompany | NewContactCompany {
    return form.getRawValue() as IContactCompany | NewContactCompany;
  }

  resetForm(form: ContactCompanyFormGroup, contactCompany: ContactCompanyFormGroupInput): void {
    const contactCompanyRawValue = { ...this.getFormDefaults(), ...contactCompany };
    form.reset({
      ...contactCompanyRawValue,
      id: { value: contactCompanyRawValue.id, disabled: true },
    } as any);
  }

  private getFormDefaults(): ContactCompanyFormDefaults {
    return {
      id: null,
    };
  }
}
