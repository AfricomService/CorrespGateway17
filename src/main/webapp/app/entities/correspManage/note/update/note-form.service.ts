import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { INote, NewNote } from '../note.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts INote for edit and NewNoteFormGroupInput for create.
 */
type NoteFormGroupInput = INote | PartialWithRequiredKeyOf<NewNote>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends INote | NewNote> = Omit<T, 'dateCreated' | 'datePublication' | 'dateEndPublication' | 'updatedDate'> & {
  dateCreated?: string | null;
  datePublication?: string | null;
  dateEndPublication?: string | null;
  updatedDate?: string | null;
};

type NoteFormRawValue = FormValueOf<INote>;

type NewNoteFormRawValue = FormValueOf<NewNote>;

type NoteFormDefaults = Pick<NewNote, 'id' | 'dateCreated' | 'datePublication' | 'dateEndPublication' | 'updatedDate'>;

type NoteFormGroupContent = {
  id: FormControl<NoteFormRawValue['id'] | NewNote['id']>;
  idinstance: FormControl<NoteFormRawValue['idinstance']>;
  reference: FormControl<NoteFormRawValue['reference']>;
  subject: FormControl<NoteFormRawValue['subject']>;
  dateCreated: FormControl<NoteFormRawValue['dateCreated']>;
  datePublication: FormControl<NoteFormRawValue['datePublication']>;
  dateEndPublication: FormControl<NoteFormRawValue['dateEndPublication']>;
  status: FormControl<NoteFormRawValue['status']>;
  createdBy: FormControl<NoteFormRawValue['createdBy']>;
  updatedBy: FormControl<NoteFormRawValue['updatedBy']>;
  updatedDate: FormControl<NoteFormRawValue['updatedDate']>;
  attachment: FormControl<NoteFormRawValue['attachment']>;
};

export type NoteFormGroup = FormGroup<NoteFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class NoteFormService {
  createNoteFormGroup(note: NoteFormGroupInput = { id: null }): NoteFormGroup {
    const noteRawValue = this.convertNoteToNoteRawValue({
      ...this.getFormDefaults(),
      ...note,
    });
    return new FormGroup<NoteFormGroupContent>({
      id: new FormControl(
        { value: noteRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        }
      ),
      idinstance: new FormControl(noteRawValue.idinstance, {
        validators: [Validators.required],
      }),
      reference: new FormControl(noteRawValue.reference),
      subject: new FormControl(noteRawValue.subject, {
        validators: [Validators.required],
      }),
      dateCreated: new FormControl(noteRawValue.dateCreated, {
        validators: [Validators.required],
      }),
      datePublication: new FormControl(noteRawValue.datePublication, {
        validators: [Validators.required],
      }),
      dateEndPublication: new FormControl(noteRawValue.dateEndPublication, {
        validators: [Validators.required],
      }),
      status: new FormControl(noteRawValue.status, {
        validators: [Validators.required],
      }),
      createdBy: new FormControl(noteRawValue.createdBy),
      updatedBy: new FormControl(noteRawValue.updatedBy),
      updatedDate: new FormControl(noteRawValue.updatedDate),
      attachment: new FormControl(noteRawValue.attachment),
    });
  }

  getNote(form: NoteFormGroup): INote | NewNote {
    return this.convertNoteRawValueToNote(form.getRawValue() as NoteFormRawValue | NewNoteFormRawValue);
  }

  resetForm(form: NoteFormGroup, note: NoteFormGroupInput): void {
    const noteRawValue = this.convertNoteToNoteRawValue({ ...this.getFormDefaults(), ...note });
    form.reset(
      {
        ...noteRawValue,
        id: { value: noteRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */
    );
  }

  private getFormDefaults(): NoteFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      dateCreated: currentTime,
      datePublication: currentTime,
      dateEndPublication: currentTime,
      updatedDate: currentTime,
    };
  }

  private convertNoteRawValueToNote(rawNote: NoteFormRawValue | NewNoteFormRawValue): INote | NewNote {
    return {
      ...rawNote,
      dateCreated: dayjs(rawNote.dateCreated, DATE_TIME_FORMAT),
      datePublication: dayjs(rawNote.datePublication, DATE_TIME_FORMAT),
      dateEndPublication: dayjs(rawNote.dateEndPublication, DATE_TIME_FORMAT),
      updatedDate: dayjs(rawNote.updatedDate, DATE_TIME_FORMAT),
    };
  }

  private convertNoteToNoteRawValue(
    note: INote | (Partial<NewNote> & NoteFormDefaults)
  ): NoteFormRawValue | PartialWithRequiredKeyOf<NewNoteFormRawValue> {
    return {
      ...note,
      dateCreated: note.dateCreated ? note.dateCreated.format(DATE_TIME_FORMAT) : undefined,
      datePublication: note.datePublication ? note.datePublication.format(DATE_TIME_FORMAT) : undefined,
      dateEndPublication: note.dateEndPublication ? note.dateEndPublication.format(DATE_TIME_FORMAT) : undefined,
      updatedDate: note.updatedDate ? note.updatedDate.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
