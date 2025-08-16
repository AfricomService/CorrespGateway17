import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IMyreport, NewMyreport } from '../myreport.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IMyreport for edit and NewMyreportFormGroupInput for create.
 */
type MyreportFormGroupInput = IMyreport | PartialWithRequiredKeyOf<NewMyreport>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IMyreport | NewMyreport> = Omit<T, 'dateCreated'> & {
  dateCreated?: string | null;
};

type MyreportFormRawValue = FormValueOf<IMyreport>;

type NewMyreportFormRawValue = FormValueOf<NewMyreport>;

type MyreportFormDefaults = Pick<NewMyreport, 'id' | 'dateCreated'>;

type MyreportFormGroupContent = {
  id: FormControl<MyreportFormRawValue['id'] | NewMyreport['id']>;
  dateCreated: FormControl<MyreportFormRawValue['dateCreated']>;
  loginName: FormControl<MyreportFormRawValue['loginName']>;
  loginId: FormControl<MyreportFormRawValue['loginId']>;
  nameFile: FormControl<MyreportFormRawValue['nameFile']>;
  nameFolder: FormControl<MyreportFormRawValue['nameFolder']>;
  configExportId: FormControl<MyreportFormRawValue['configExportId']>;
  configexport: FormControl<MyreportFormRawValue['configexport']>;
};

export type MyreportFormGroup = FormGroup<MyreportFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class MyreportFormService {
  createMyreportFormGroup(myreport: MyreportFormGroupInput = { id: null }): MyreportFormGroup {
    const myreportRawValue = this.convertMyreportToMyreportRawValue({
      ...this.getFormDefaults(),
      ...myreport,
    });
    return new FormGroup<MyreportFormGroupContent>({
      id: new FormControl(
        { value: myreportRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      dateCreated: new FormControl(myreportRawValue.dateCreated),
      loginName: new FormControl(myreportRawValue.loginName),
      loginId: new FormControl(myreportRawValue.loginId),
      nameFile: new FormControl(myreportRawValue.nameFile),
      nameFolder: new FormControl(myreportRawValue.nameFolder),
      configExportId: new FormControl(myreportRawValue.configExportId),
      configexport: new FormControl(myreportRawValue.configexport),
    });
  }

  getMyreport(form: MyreportFormGroup): IMyreport | NewMyreport {
    return this.convertMyreportRawValueToMyreport(form.getRawValue() as MyreportFormRawValue | NewMyreportFormRawValue);
  }

  resetForm(form: MyreportFormGroup, myreport: MyreportFormGroupInput): void {
    const myreportRawValue = this.convertMyreportToMyreportRawValue({ ...this.getFormDefaults(), ...myreport });
    form.reset(
      {
        ...myreportRawValue,
        id: { value: myreportRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): MyreportFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      dateCreated: currentTime,
    };
  }

  private convertMyreportRawValueToMyreport(rawMyreport: MyreportFormRawValue | NewMyreportFormRawValue): IMyreport | NewMyreport {
    return {
      ...rawMyreport,
      dateCreated: dayjs(rawMyreport.dateCreated, DATE_TIME_FORMAT),
    };
  }

  private convertMyreportToMyreportRawValue(
    myreport: IMyreport | (Partial<NewMyreport> & MyreportFormDefaults)
  ): MyreportFormRawValue | PartialWithRequiredKeyOf<NewMyreportFormRawValue> {
    return {
      ...myreport,
      dateCreated: myreport.dateCreated ? myreport.dateCreated.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
