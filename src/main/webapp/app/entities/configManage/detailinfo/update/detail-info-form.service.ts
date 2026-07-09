import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IDetailInfo, NewDetailInfo } from '../detail-info.model';

type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

type DetailInfoFormGroupInput = IDetailInfo | PartialWithRequiredKeyOf<NewDetailInfo>;

type DetailInfoFormDefaults = Pick<NewDetailInfo, 'id' | 'status' | 'required'>;

type DetailInfoFormGroupContent = {
  id: FormControl<IDetailInfo['id'] | NewDetailInfo['id']>;
  status: FormControl<IDetailInfo['status']>;
  label: FormControl<IDetailInfo['label']>;
  code: FormControl<IDetailInfo['code']>;
  required: FormControl<IDetailInfo['required']>;
  inputType: FormControl<IDetailInfo['inputType']>;
  multipleChoiceOption: FormControl<IDetailInfo['multipleChoiceOption']>;
};

export type DetailInfoFormGroup = FormGroup<DetailInfoFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class DetailInfoFormService {
  createDetailInfoFormGroup(detailInfo: DetailInfoFormGroupInput = { id: null }): DetailInfoFormGroup {
    const detailInfoRawValue = {
      ...this.getFormDefaults(),
      ...detailInfo,
    };
    return new FormGroup<DetailInfoFormGroupContent>({
      id: new FormControl(
        { value: detailInfoRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      status: new FormControl(detailInfoRawValue.status),
      label: new FormControl(detailInfoRawValue.label, {
        validators: [Validators.required],
      }),
      code: new FormControl(detailInfoRawValue.code, {
        validators: [Validators.required],
      }),
      required: new FormControl(detailInfoRawValue.required),
      inputType: new FormControl(detailInfoRawValue.inputType, {
        validators: [Validators.required],
      }),
      multipleChoiceOption: new FormControl(detailInfoRawValue.multipleChoiceOption),
    });
  }

  getDetailInfo(form: DetailInfoFormGroup): IDetailInfo | NewDetailInfo {
    return form.getRawValue() as IDetailInfo | NewDetailInfo;
  }

  resetForm(form: DetailInfoFormGroup, detailInfo: DetailInfoFormGroupInput): void {
    const detailInfoRawValue = { ...this.getFormDefaults(), ...detailInfo };
    form.reset({
      ...detailInfoRawValue,
      id: { value: detailInfoRawValue.id, disabled: true },
    } as any);
  }

  private getFormDefaults(): DetailInfoFormDefaults {
    return {
      id: null,
      status: false,
      required: false,
    };
  }
}
