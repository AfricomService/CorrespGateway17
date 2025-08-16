import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../employe.test-samples';

import { EmployeFormService } from './employe-form.service';

describe('Employe Form Service', () => {
  let service: EmployeFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeFormService);
  });

  describe('Service methods', () => {
    describe('createEmployeFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createEmployeFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            jobTitle: expect.any(Object),
            email: expect.any(Object),
            phoneNumber: expect.any(Object),
          })
        );
      });

      it('passing IEmploye should create a new form with FormGroup', () => {
        const formGroup = service.createEmployeFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            jobTitle: expect.any(Object),
            email: expect.any(Object),
            phoneNumber: expect.any(Object),
          })
        );
      });
    });

    describe('getEmploye', () => {
      it('should return NewEmploye for default Employe initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createEmployeFormGroup(sampleWithNewData);

        const employe = service.getEmploye(formGroup) as any;

        expect(employe).toMatchObject(sampleWithNewData);
      });

      it('should return NewEmploye for empty Employe initial value', () => {
        const formGroup = service.createEmployeFormGroup();

        const employe = service.getEmploye(formGroup) as any;

        expect(employe).toMatchObject({});
      });

      it('should return IEmploye', () => {
        const formGroup = service.createEmployeFormGroup(sampleWithRequiredData);

        const employe = service.getEmploye(formGroup) as any;

        expect(employe).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IEmploye should not enable id FormControl', () => {
        const formGroup = service.createEmployeFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewEmploye should disable id FormControl', () => {
        const formGroup = service.createEmployeFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
