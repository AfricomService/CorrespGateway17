import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { ICompany, NewCompany } from '../company.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ICompany for edit and NewCompanyFormGroupInput for create.
 */
type CompanyFormGroupInput = ICompany | PartialWithRequiredKeyOf<NewCompany>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends ICompany | NewCompany> = Omit<T, 'foundedDate' | 'createdDate' | 'updatedDate'> & {
  foundedDate?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
};

type CompanyFormRawValue = FormValueOf<ICompany>;

type NewCompanyFormRawValue = FormValueOf<NewCompany>;

type CompanyFormDefaults = Pick<NewCompany, 'id' | 'foundedDate' | 'createdDate' | 'updatedDate'>;

type CompanyFormGroupContent = {
  id: FormControl<CompanyFormRawValue['id'] | NewCompany['id']>;
  name: FormControl<CompanyFormRawValue['name']>;
  registrationNumber: FormControl<CompanyFormRawValue['registrationNumber']>;
  address: FormControl<CompanyFormRawValue['address']>;
  email: FormControl<CompanyFormRawValue['email']>;
  phoneNumber: FormControl<CompanyFormRawValue['phoneNumber']>;
  website: FormControl<CompanyFormRawValue['website']>;
  foundedDate: FormControl<CompanyFormRawValue['foundedDate']>;
  createdDate: FormControl<CompanyFormRawValue['createdDate']>;
  updatedDate: FormControl<CompanyFormRawValue['updatedDate']>;
};

export type CompanyFormGroup = FormGroup<CompanyFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class CompanyFormService {
  createCompanyFormGroup(company: CompanyFormGroupInput = { id: null }): CompanyFormGroup {
    const companyRawValue = this.convertCompanyToCompanyRawValue({
      ...this.getFormDefaults(),
      ...company,
    });
    return new FormGroup<CompanyFormGroupContent>({
      id: new FormControl(
        { value: companyRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      name: new FormControl(companyRawValue.name, {
        validators: [Validators.required],
      }),
      registrationNumber: new FormControl(companyRawValue.registrationNumber),
      address: new FormControl(companyRawValue.address),
      email: new FormControl(companyRawValue.email),
      phoneNumber: new FormControl(companyRawValue.phoneNumber),
      website: new FormControl(companyRawValue.website),
      foundedDate: new FormControl(companyRawValue.foundedDate),
      createdDate: new FormControl(companyRawValue.createdDate),
      updatedDate: new FormControl(companyRawValue.updatedDate),
    });
  }

  getCompany(form: CompanyFormGroup): ICompany | NewCompany {
    return this.convertCompanyRawValueToCompany(form.getRawValue() as CompanyFormRawValue | NewCompanyFormRawValue);
  }

  resetForm(form: CompanyFormGroup, company: CompanyFormGroupInput): void {
    const companyRawValue = this.convertCompanyToCompanyRawValue({ ...this.getFormDefaults(), ...company });
    form.reset(
      {
        ...companyRawValue,
        id: { value: companyRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): CompanyFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      foundedDate: currentTime,
      createdDate: currentTime,
      updatedDate: currentTime,
    };
  }

  private convertCompanyRawValueToCompany(rawCompany: CompanyFormRawValue | NewCompanyFormRawValue): ICompany | NewCompany {
    return {
      ...rawCompany,
      foundedDate: dayjs(rawCompany.foundedDate, DATE_TIME_FORMAT),
      createdDate: dayjs(rawCompany.createdDate, DATE_TIME_FORMAT),
      updatedDate: dayjs(rawCompany.updatedDate, DATE_TIME_FORMAT),
    };
  }

  private convertCompanyToCompanyRawValue(
    company: ICompany | (Partial<NewCompany> & CompanyFormDefaults)
  ): CompanyFormRawValue | PartialWithRequiredKeyOf<NewCompanyFormRawValue> {
    return {
      ...company,
      foundedDate: company.foundedDate ? company.foundedDate.format(DATE_TIME_FORMAT) : undefined,
      createdDate: company.createdDate ? company.createdDate.format(DATE_TIME_FORMAT) : undefined,
      updatedDate: company.updatedDate ? company.updatedDate.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
