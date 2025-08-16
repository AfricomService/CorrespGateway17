import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../numsequentielle.test-samples';

import { NumsequentielleFormService } from './numsequentielle-form.service';

describe('Numsequentielle Form Service', () => {
  let service: NumsequentielleFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NumsequentielleFormService);
  });

  describe('Service methods', () => {
    describe('createNumsequentielleFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createNumsequentielleFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            prefix: expect.any(Object),
            nextNumber: expect.any(Object),
            format: expect.any(Object),
          })
        );
      });

      it('passing INumsequentielle should create a new form with FormGroup', () => {
        const formGroup = service.createNumsequentielleFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            prefix: expect.any(Object),
            nextNumber: expect.any(Object),
            format: expect.any(Object),
          })
        );
      });
    });

    describe('getNumsequentielle', () => {
      it('should return NewNumsequentielle for default Numsequentielle initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createNumsequentielleFormGroup(sampleWithNewData);

        const numsequentielle = service.getNumsequentielle(formGroup) as any;

        expect(numsequentielle).toMatchObject(sampleWithNewData);
      });

      it('should return NewNumsequentielle for empty Numsequentielle initial value', () => {
        const formGroup = service.createNumsequentielleFormGroup();

        const numsequentielle = service.getNumsequentielle(formGroup) as any;

        expect(numsequentielle).toMatchObject({});
      });

      it('should return INumsequentielle', () => {
        const formGroup = service.createNumsequentielleFormGroup(sampleWithRequiredData);

        const numsequentielle = service.getNumsequentielle(formGroup) as any;

        expect(numsequentielle).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing INumsequentielle should not enable id FormControl', () => {
        const formGroup = service.createNumsequentielleFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewNumsequentielle should disable id FormControl', () => {
        const formGroup = service.createNumsequentielleFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
