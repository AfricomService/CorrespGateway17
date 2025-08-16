import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../bordereaux.test-samples';

import { BordereauxFormService } from './bordereaux-form.service';

describe('Bordereaux Form Service', () => {
  let service: BordereauxFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BordereauxFormService);
  });

  describe('Service methods', () => {
    describe('createBordereauxFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createBordereauxFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            reference: expect.any(Object),
            description: expect.any(Object),
            amount: expect.any(Object),
            currency: expect.any(Object),
            status: expect.any(Object),
            issuedDate: expect.any(Object),
            dueDate: expect.any(Object),
            createdDate: expect.any(Object),
            updatedDate: expect.any(Object),
            createdBy: expect.any(Object),
            updatedBy: expect.any(Object),
            corresps: expect.any(Object),
          })
        );
      });

      it('passing IBordereaux should create a new form with FormGroup', () => {
        const formGroup = service.createBordereauxFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            reference: expect.any(Object),
            description: expect.any(Object),
            amount: expect.any(Object),
            currency: expect.any(Object),
            status: expect.any(Object),
            issuedDate: expect.any(Object),
            dueDate: expect.any(Object),
            createdDate: expect.any(Object),
            updatedDate: expect.any(Object),
            createdBy: expect.any(Object),
            updatedBy: expect.any(Object),
            corresps: expect.any(Object),
          })
        );
      });
    });

    describe('getBordereaux', () => {
      it('should return NewBordereaux for default Bordereaux initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createBordereauxFormGroup(sampleWithNewData);

        const bordereaux = service.getBordereaux(formGroup) as any;

        expect(bordereaux).toMatchObject(sampleWithNewData);
      });

      it('should return NewBordereaux for empty Bordereaux initial value', () => {
        const formGroup = service.createBordereauxFormGroup();

        const bordereaux = service.getBordereaux(formGroup) as any;

        expect(bordereaux).toMatchObject({});
      });

      it('should return IBordereaux', () => {
        const formGroup = service.createBordereauxFormGroup(sampleWithRequiredData);

        const bordereaux = service.getBordereaux(formGroup) as any;

        expect(bordereaux).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IBordereaux should not enable id FormControl', () => {
        const formGroup = service.createBordereauxFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewBordereaux should disable id FormControl', () => {
        const formGroup = service.createBordereauxFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
