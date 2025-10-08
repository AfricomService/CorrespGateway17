import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { ICustomSearch, NewCustomSearch } from '../custom-search.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ICustomSearch for edit and NewCustomSearchFormGroupInput for create.
 */
type CustomSearchFormGroupInput = ICustomSearch | PartialWithRequiredKeyOf<NewCustomSearch>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends ICustomSearch | NewCustomSearch> = Omit<T, 'dateCreation'> & {
  dateCreation?: string | null;
};

type CustomSearchFormRawValue = FormValueOf<ICustomSearch>;

type NewCustomSearchFormRawValue = FormValueOf<NewCustomSearch>;

type CustomSearchFormDefaults = Pick<NewCustomSearch, 'id' | 'dateCreation'>;

type CustomSearchFormGroupContent = {
  id: FormControl<CustomSearchFormRawValue['id'] | NewCustomSearch['id']>;
  dateCreation: FormControl<CustomSearchFormRawValue['dateCreation']>;
  readAccess: FormControl<CustomSearchFormRawValue['readAccess']>;
  visibility: FormControl<CustomSearchFormRawValue['visibility']>;
  request: FormControl<CustomSearchFormRawValue['request']>;
  entitySearching: FormControl<CustomSearchFormRawValue['entitySearching']>;
  userLogin: FormControl<CustomSearchFormRawValue['userLogin']>;
  name: FormControl<CustomSearchFormRawValue['name']>;
};

export type CustomSearchFormGroup = FormGroup<CustomSearchFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class CustomSearchFormService {
  createCustomSearchFormGroup(customSearch: CustomSearchFormGroupInput = { id: null }): CustomSearchFormGroup {
    const customSearchRawValue = this.convertCustomSearchToCustomSearchRawValue({
      ...this.getFormDefaults(),
      ...customSearch,
    });
    return new FormGroup<CustomSearchFormGroupContent>({
      id: new FormControl(
        { value: customSearchRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      dateCreation: new FormControl(customSearchRawValue.dateCreation),
      readAccess: new FormControl(customSearchRawValue.readAccess),
      visibility: new FormControl(customSearchRawValue.visibility),
      request: new FormControl(customSearchRawValue.request),
      entitySearching: new FormControl(customSearchRawValue.entitySearching),
      userLogin: new FormControl(customSearchRawValue.userLogin),
      name: new FormControl(customSearchRawValue.name),
    });
  }

  getCustomSearch(form: CustomSearchFormGroup): ICustomSearch | NewCustomSearch {
    return this.convertCustomSearchRawValueToCustomSearch(form.getRawValue() as CustomSearchFormRawValue | NewCustomSearchFormRawValue);
  }

  resetForm(form: CustomSearchFormGroup, customSearch: CustomSearchFormGroupInput): void {
    const customSearchRawValue = this.convertCustomSearchToCustomSearchRawValue({ ...this.getFormDefaults(), ...customSearch });
    form.reset(
      {
        ...customSearchRawValue,
        id: { value: customSearchRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): CustomSearchFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      dateCreation: currentTime,
    };
  }

  private convertCustomSearchRawValueToCustomSearch(
    rawCustomSearch: CustomSearchFormRawValue | NewCustomSearchFormRawValue
  ): ICustomSearch | NewCustomSearch {
    return {
      ...rawCustomSearch,
      dateCreation: dayjs(rawCustomSearch.dateCreation, DATE_TIME_FORMAT),
    };
  }

  private convertCustomSearchToCustomSearchRawValue(
    customSearch: ICustomSearch | (Partial<NewCustomSearch> & CustomSearchFormDefaults)
  ): CustomSearchFormRawValue | PartialWithRequiredKeyOf<NewCustomSearchFormRawValue> {
    return {
      ...customSearch,
      dateCreation: customSearch.dateCreation ? customSearch.dateCreation.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
