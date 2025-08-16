import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../note.test-samples';

import { NoteFormService } from './note-form.service';

describe('Note Form Service', () => {
  let service: NoteFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteFormService);
  });

  describe('Service methods', () => {
    describe('createNoteFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createNoteFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            idinstance: expect.any(Object),
            reference: expect.any(Object),
            subject: expect.any(Object),
            dateCreated: expect.any(Object),
            datePublication: expect.any(Object),
            dateEndPublication: expect.any(Object),
            status: expect.any(Object),
            createdBy: expect.any(Object),
            updatedBy: expect.any(Object),
            updatedDate: expect.any(Object),
            attachment: expect.any(Object),
          })
        );
      });

      it('passing INote should create a new form with FormGroup', () => {
        const formGroup = service.createNoteFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            idinstance: expect.any(Object),
            reference: expect.any(Object),
            subject: expect.any(Object),
            dateCreated: expect.any(Object),
            datePublication: expect.any(Object),
            dateEndPublication: expect.any(Object),
            status: expect.any(Object),
            createdBy: expect.any(Object),
            updatedBy: expect.any(Object),
            updatedDate: expect.any(Object),
            attachment: expect.any(Object),
          })
        );
      });
    });

    describe('getNote', () => {
      it('should return NewNote for default Note initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createNoteFormGroup(sampleWithNewData);

        const note = service.getNote(formGroup) as any;

        expect(note).toMatchObject(sampleWithNewData);
      });

      it('should return NewNote for empty Note initial value', () => {
        const formGroup = service.createNoteFormGroup();

        const note = service.getNote(formGroup) as any;

        expect(note).toMatchObject({});
      });

      it('should return INote', () => {
        const formGroup = service.createNoteFormGroup(sampleWithRequiredData);

        const note = service.getNote(formGroup) as any;

        expect(note).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing INote should not enable id FormControl', () => {
        const formGroup = service.createNoteFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewNote should disable id FormControl', () => {
        const formGroup = service.createNoteFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
