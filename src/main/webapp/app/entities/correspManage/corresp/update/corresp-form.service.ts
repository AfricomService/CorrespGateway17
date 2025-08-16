import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { ICorresp, NewCorresp } from '../corresp.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ICorresp for edit and NewCorrespFormGroupInput for create.
 */
type CorrespFormGroupInput = ICorresp | PartialWithRequiredKeyOf<NewCorresp>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends ICorresp | NewCorresp> = Omit<T, 'dateCreated' | 'courrierDate' | 'updatedDate'> & {
  dateCreated?: string | null;
  courrierDate?: string | null;
  updatedDate?: string | null;
};

type CorrespFormRawValue = FormValueOf<ICorresp>;

type NewCorrespFormRawValue = FormValueOf<NewCorresp>;

type CorrespFormDefaults = Pick<
  NewCorresp,
  'id' | 'dateCreated' | 'courrierDate' | 'priority' | 'needsResponse' | 'updatedDate' | 'dossiers' | 'bordereaux' | 'attachments' | 'tasks'
>;

type CorrespFormGroupContent = {
  id: FormControl<CorrespFormRawValue['id'] | NewCorresp['id']>;
  idinstance: FormControl<CorrespFormRawValue['idinstance']>;
  reference: FormControl<CorrespFormRawValue['reference']>;
  subject: FormControl<CorrespFormRawValue['subject']>;
  dateCreated: FormControl<CorrespFormRawValue['dateCreated']>;
  courrierDate: FormControl<CorrespFormRawValue['courrierDate']>;
  status: FormControl<CorrespFormRawValue['status']>;
  priority: FormControl<CorrespFormRawValue['priority']>;
  body: FormControl<CorrespFormRawValue['body']>;
  corresptype: FormControl<CorrespFormRawValue['corresptype']>;
  sender: FormControl<CorrespFormRawValue['sender']>;
  needsResponse: FormControl<CorrespFormRawValue['needsResponse']>;
  responseTo: FormControl<CorrespFormRawValue['responseTo']>;
  step: FormControl<CorrespFormRawValue['step']>;
  stepCode: FormControl<CorrespFormRawValue['stepCode']>;
  processId: FormControl<CorrespFormRawValue['processId']>;
  processVersion: FormControl<CorrespFormRawValue['processVersion']>;
  contact: FormControl<CorrespFormRawValue['contact']>;
  senderReference: FormControl<CorrespFormRawValue['senderReference']>;
  dispatchType: FormControl<CorrespFormRawValue['dispatchType']>;
  contactCompany: FormControl<CorrespFormRawValue['contactCompany']>;
  personCompany: FormControl<CorrespFormRawValue['personCompany']>;
  contactAddress: FormControl<CorrespFormRawValue['contactAddress']>;
  contactEmail: FormControl<CorrespFormRawValue['contactEmail']>;
  contactEmailCc: FormControl<CorrespFormRawValue['contactEmailCc']>;
  createdBy: FormControl<CorrespFormRawValue['createdBy']>;
  updatedBy: FormControl<CorrespFormRawValue['updatedBy']>;
  updatedDate: FormControl<CorrespFormRawValue['updatedDate']>;
  dossiers: FormControl<CorrespFormRawValue['dossiers']>;
  bordereaux: FormControl<CorrespFormRawValue['bordereaux']>;
  attachments: FormControl<CorrespFormRawValue['attachments']>;
  tasks: FormControl<CorrespFormRawValue['tasks']>;
};

export type CorrespFormGroup = FormGroup<CorrespFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class CorrespFormService {
  createCorrespFormGroup(corresp: CorrespFormGroupInput = { id: null }): CorrespFormGroup {
    const correspRawValue = this.convertCorrespToCorrespRawValue({
      ...this.getFormDefaults(),
      ...corresp,
    });
    return new FormGroup<CorrespFormGroupContent>({
      id: new FormControl(
        { value: correspRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      idinstance: new FormControl(correspRawValue.idinstance, {
        validators: [Validators.required],
      }),
      reference: new FormControl(correspRawValue.reference),
      subject: new FormControl(correspRawValue.subject, {
        validators: [Validators.required],
      }),
      dateCreated: new FormControl(correspRawValue.dateCreated, {
        validators: [Validators.required],
      }),
      courrierDate: new FormControl(correspRawValue.courrierDate, {
        validators: [Validators.required],
      }),
      status: new FormControl(correspRawValue.status, {
        validators: [Validators.required],
      }),
      priority: new FormControl(correspRawValue.priority),
      body: new FormControl(correspRawValue.body),
      corresptype: new FormControl(correspRawValue.corresptype, {
        validators: [Validators.required],
      }),
      sender: new FormControl(correspRawValue.sender, {
        validators: [Validators.required],
      }),
      needsResponse: new FormControl(correspRawValue.needsResponse),
      responseTo: new FormControl(correspRawValue.responseTo),
      step: new FormControl(correspRawValue.step),
      stepCode: new FormControl(correspRawValue.stepCode),
      processId: new FormControl(correspRawValue.processId),
      processVersion: new FormControl(correspRawValue.processVersion),
      contact: new FormControl(correspRawValue.contact),
      senderReference: new FormControl(correspRawValue.senderReference),
      dispatchType: new FormControl(correspRawValue.dispatchType, {
        validators: [Validators.required],
      }),
      contactCompany: new FormControl(correspRawValue.contactCompany),
      personCompany: new FormControl(correspRawValue.personCompany),
      contactAddress: new FormControl(correspRawValue.contactAddress),
      contactEmail: new FormControl(correspRawValue.contactEmail),
      contactEmailCc: new FormControl(correspRawValue.contactEmailCc),
      createdBy: new FormControl(correspRawValue.createdBy),
      updatedBy: new FormControl(correspRawValue.updatedBy),
      updatedDate: new FormControl(correspRawValue.updatedDate),
      dossiers: new FormControl(correspRawValue.dossiers ?? []),
      bordereaux: new FormControl(correspRawValue.bordereaux ?? []),
      attachments: new FormControl(correspRawValue.attachments ?? []),
      tasks: new FormControl(correspRawValue.tasks ?? []),
    });
  }

  getCorresp(form: CorrespFormGroup): ICorresp | NewCorresp {
    return this.convertCorrespRawValueToCorresp(form.getRawValue() as CorrespFormRawValue | NewCorrespFormRawValue);
  }

  resetForm(form: CorrespFormGroup, corresp: CorrespFormGroupInput): void {
    const correspRawValue = this.convertCorrespToCorrespRawValue({ ...this.getFormDefaults(), ...corresp });
    form.reset(
      {
        ...correspRawValue,
        id: { value: correspRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): CorrespFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      dateCreated: currentTime,
      courrierDate: currentTime,
      priority: false,
      needsResponse: false,
      updatedDate: currentTime,
      dossiers: [],
      bordereaux: [],
      attachments: [],
      tasks: [],
    };
  }

  private convertCorrespRawValueToCorresp(rawCorresp: CorrespFormRawValue | NewCorrespFormRawValue): ICorresp | NewCorresp {
    return {
      ...rawCorresp,
      dateCreated: dayjs(rawCorresp.dateCreated, DATE_TIME_FORMAT),
      courrierDate: dayjs(rawCorresp.courrierDate, DATE_TIME_FORMAT),
      updatedDate: dayjs(rawCorresp.updatedDate, DATE_TIME_FORMAT),
    };
  }

  private convertCorrespToCorrespRawValue(
    corresp: ICorresp | (Partial<NewCorresp> & CorrespFormDefaults)
  ): CorrespFormRawValue | PartialWithRequiredKeyOf<NewCorrespFormRawValue> {
    return {
      ...corresp,
      dateCreated: corresp.dateCreated ? corresp.dateCreated.format(DATE_TIME_FORMAT) : undefined,
      courrierDate: corresp.courrierDate ? corresp.courrierDate.format(DATE_TIME_FORMAT) : undefined,
      updatedDate: corresp.updatedDate ? corresp.updatedDate.format(DATE_TIME_FORMAT) : undefined,
      dossiers: corresp.dossiers ?? [],
      bordereaux: corresp.bordereaux ?? [],
      attachments: corresp.attachments ?? [],
      tasks: corresp.tasks ?? [],
    };
  }
}
