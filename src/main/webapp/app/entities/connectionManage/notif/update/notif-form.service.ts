import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { INotif, NewNotif } from '../notif.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts INotif for edit and NewNotifFormGroupInput for create.
 */
type NotifFormGroupInput = INotif | PartialWithRequiredKeyOf<NewNotif>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends INotif | NewNotif> = Omit<T, 'sentDate'> & {
  sentDate?: string | null;
};

type NotifFormRawValue = FormValueOf<INotif>;

type NewNotifFormRawValue = FormValueOf<NewNotif>;

type NotifFormDefaults = Pick<NewNotif, 'id' | 'sentDate'>;

type NotifFormGroupContent = {
  id: FormControl<NotifFormRawValue['id'] | NewNotif['id']>;
  title: FormControl<NotifFormRawValue['title']>;
  body: FormControl<NotifFormRawValue['body']>;
  recipientEmail: FormControl<NotifFormRawValue['recipientEmail']>;
  recipeientccemail: FormControl<NotifFormRawValue['recipeientccemail']>;
  receipientbccemail: FormControl<NotifFormRawValue['receipientbccemail']>;
  senderEmail: FormControl<NotifFormRawValue['senderEmail']>;
  sentDate: FormControl<NotifFormRawValue['sentDate']>;
  status: FormControl<NotifFormRawValue['status']>;
  typeNotif: FormControl<NotifFormRawValue['typeNotif']>;
  messageID: FormControl<NotifFormRawValue['messageID']>;
};

export type NotifFormGroup = FormGroup<NotifFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class NotifFormService {
  createNotifFormGroup(notif: NotifFormGroupInput = { id: null }): NotifFormGroup {
    const notifRawValue = this.convertNotifToNotifRawValue({
      ...this.getFormDefaults(),
      ...notif,
    });
    return new FormGroup<NotifFormGroupContent>({
      id: new FormControl(
        { value: notifRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      title: new FormControl(notifRawValue.title),
      body: new FormControl(notifRawValue.body),
      recipientEmail: new FormControl(notifRawValue.recipientEmail, {
        validators: [Validators.required],
      }),
      recipeientccemail: new FormControl(notifRawValue.recipeientccemail),
      receipientbccemail: new FormControl(notifRawValue.receipientbccemail),
      senderEmail: new FormControl(notifRawValue.senderEmail, {
        validators: [Validators.required],
      }),
      sentDate: new FormControl(notifRawValue.sentDate),
      status: new FormControl(notifRawValue.status, {
        validators: [Validators.required],
      }),
      typeNotif: new FormControl(notifRawValue.typeNotif),
      messageID: new FormControl(notifRawValue.messageID),
    });
  }

  getNotif(form: NotifFormGroup): INotif | NewNotif {
    return this.convertNotifRawValueToNotif(form.getRawValue() as NotifFormRawValue | NewNotifFormRawValue);
  }

  resetForm(form: NotifFormGroup, notif: NotifFormGroupInput): void {
    const notifRawValue = this.convertNotifToNotifRawValue({ ...this.getFormDefaults(), ...notif });
    form.reset(
      {
        ...notifRawValue,
        id: { value: notifRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): NotifFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      sentDate: currentTime,
    };
  }

  private convertNotifRawValueToNotif(rawNotif: NotifFormRawValue | NewNotifFormRawValue): INotif | NewNotif {
    return {
      ...rawNotif,
      sentDate: dayjs(rawNotif.sentDate, DATE_TIME_FORMAT),
    };
  }

  private convertNotifToNotifRawValue(
    notif: INotif | (Partial<NewNotif> & NotifFormDefaults)
  ): NotifFormRawValue | PartialWithRequiredKeyOf<NewNotifFormRawValue> {
    return {
      ...notif,
      sentDate: notif.sentDate ? notif.sentDate.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
