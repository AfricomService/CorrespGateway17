import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../departement.test-samples';

import { DepartementFormService } from './departement-form.service';

describe('Departement Form Service', () => {
  let service: DepartementFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DepartementFormService);
  });

  describe('Service methods', () => {
    describe('createDepartementFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createDepartementFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            code: expect.any(Object),
            name: expect.any(Object),
            description: expect.any(Object),
            createdDate: expect.any(Object),
            updatedDate: expect.any(Object),
          })
        );
      });

      it('passing IDepartement should create a new form with FormGroup', () => {
        const formGroup = service.createDepartementFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            code: expect.any(Object),
            name: expect.any(Object),
            description: expect.any(Object),
            createdDate: expect.any(Object),
            updatedDate: expect.any(Object),
          })
        );
      });
    });

    describe('getDepartement', () => {
      it('should return NewDepartement for default Departement initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createDepartementFormGroup(sampleWithNewData);

        const departement = service.getDepartement(formGroup) as any;

        expect(departement).toMatchObject(sampleWithNewData);
      });

      it('should return NewDepartement for empty Departement initial value', () => {
        const formGroup = service.createDepartementFormGroup();

        const departement = service.getDepartement(formGroup) as any;

        expect(departement).toMatchObject({});
      });

      it('should return IDepartement', () => {
        const formGroup = service.createDepartementFormGroup(sampleWithRequiredData);

        const departement = service.getDepartement(formGroup) as any;

        expect(departement).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IDepartement should not enable id FormControl', () => {
        const formGroup = service.createDepartementFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewDepartement should disable id FormControl', () => {
        const formGroup = service.createDepartementFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
