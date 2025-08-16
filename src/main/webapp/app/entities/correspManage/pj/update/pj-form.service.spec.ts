import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../pj.test-samples';

import { PjFormService } from './pj-form.service';

describe('Pj Form Service', () => {
  let service: PjFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PjFormService);
  });

  describe('Service methods', () => {
    describe('createPjFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createPjFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            fileType: expect.any(Object),
            path: expect.any(Object),
            creationDate: expect.any(Object),
            password: expect.any(Object),
            transferable: expect.any(Object),
            uniqueName: expect.any(Object),
            status: expect.any(Object),
            createdBy: expect.any(Object),
            updatedBy: expect.any(Object),
            updatedDate: expect.any(Object),
            corresps: expect.any(Object),
          })
        );
      });

      it('passing IPj should create a new form with FormGroup', () => {
        const formGroup = service.createPjFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            fileType: expect.any(Object),
            path: expect.any(Object),
            creationDate: expect.any(Object),
            password: expect.any(Object),
            transferable: expect.any(Object),
            uniqueName: expect.any(Object),
            status: expect.any(Object),
            createdBy: expect.any(Object),
            updatedBy: expect.any(Object),
            updatedDate: expect.any(Object),
            corresps: expect.any(Object),
          })
        );
      });
    });

    describe('getPj', () => {
      it('should return NewPj for default Pj initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createPjFormGroup(sampleWithNewData);

        const pj = service.getPj(formGroup) as any;

        expect(pj).toMatchObject(sampleWithNewData);
      });

      it('should return NewPj for empty Pj initial value', () => {
        const formGroup = service.createPjFormGroup();

        const pj = service.getPj(formGroup) as any;

        expect(pj).toMatchObject({});
      });

      it('should return IPj', () => {
        const formGroup = service.createPjFormGroup(sampleWithRequiredData);

        const pj = service.getPj(formGroup) as any;

        expect(pj).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IPj should not enable id FormControl', () => {
        const formGroup = service.createPjFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewPj should disable id FormControl', () => {
        const formGroup = service.createPjFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
