import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../hist-action.test-samples';

import { HistActionFormService } from './hist-action-form.service';

describe('HistAction Form Service', () => {
  let service: HistActionFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistActionFormService);
  });

  describe('Service methods', () => {
    describe('createHistActionFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createHistActionFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            dateTransaction: expect.any(Object),
            loginUser: expect.any(Object),
            transaction: expect.any(Object),
            actionRef: expect.any(Object),
            actionJson: expect.any(Object),
          })
        );
      });

      it('passing IHistAction should create a new form with FormGroup', () => {
        const formGroup = service.createHistActionFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            dateTransaction: expect.any(Object),
            loginUser: expect.any(Object),
            transaction: expect.any(Object),
            actionRef: expect.any(Object),
            actionJson: expect.any(Object),
          })
        );
      });
    });

    describe('getHistAction', () => {
      it('should return NewHistAction for default HistAction initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createHistActionFormGroup(sampleWithNewData);

        const histAction = service.getHistAction(formGroup) as any;

        expect(histAction).toMatchObject(sampleWithNewData);
      });

      it('should return NewHistAction for empty HistAction initial value', () => {
        const formGroup = service.createHistActionFormGroup();

        const histAction = service.getHistAction(formGroup) as any;

        expect(histAction).toMatchObject({});
      });

      it('should return IHistAction', () => {
        const formGroup = service.createHistActionFormGroup(sampleWithRequiredData);

        const histAction = service.getHistAction(formGroup) as any;

        expect(histAction).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IHistAction should not enable id FormControl', () => {
        const formGroup = service.createHistActionFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewHistAction should disable id FormControl', () => {
        const formGroup = service.createHistActionFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
