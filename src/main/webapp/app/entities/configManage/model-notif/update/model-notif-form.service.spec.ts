import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../model-notif.test-samples';

import { ModelNotifFormService } from './model-notif-form.service';

describe('ModelNotif Form Service', () => {
  let service: ModelNotifFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelNotifFormService);
  });

  describe('Service methods', () => {
    describe('createModelNotifFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createModelNotifFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            famille: expect.any(Object),
            code: expect.any(Object),
            content: expect.any(Object),
            subjectFormula: expect.any(Object),
            senderEmailFormule: expect.any(Object),
            recepientEmailFormule: expect.any(Object),
            createdDate: expect.any(Object),
          })
        );
      });

      it('passing IModelNotif should create a new form with FormGroup', () => {
        const formGroup = service.createModelNotifFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            famille: expect.any(Object),
            code: expect.any(Object),
            content: expect.any(Object),
            subjectFormula: expect.any(Object),
            senderEmailFormule: expect.any(Object),
            recepientEmailFormule: expect.any(Object),
            createdDate: expect.any(Object),
          })
        );
      });
    });

    describe('getModelNotif', () => {
      it('should return NewModelNotif for default ModelNotif initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createModelNotifFormGroup(sampleWithNewData);

        const modelNotif = service.getModelNotif(formGroup) as any;

        expect(modelNotif).toMatchObject(sampleWithNewData);
      });

      it('should return NewModelNotif for empty ModelNotif initial value', () => {
        const formGroup = service.createModelNotifFormGroup();

        const modelNotif = service.getModelNotif(formGroup) as any;

        expect(modelNotif).toMatchObject({});
      });

      it('should return IModelNotif', () => {
        const formGroup = service.createModelNotifFormGroup(sampleWithRequiredData);

        const modelNotif = service.getModelNotif(formGroup) as any;

        expect(modelNotif).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IModelNotif should not enable id FormControl', () => {
        const formGroup = service.createModelNotifFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewModelNotif should disable id FormControl', () => {
        const formGroup = service.createModelNotifFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
