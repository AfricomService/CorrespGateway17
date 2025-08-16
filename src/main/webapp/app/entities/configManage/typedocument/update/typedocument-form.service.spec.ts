import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../typedocument.test-samples';

import { TypedocumentFormService } from './typedocument-form.service';

describe('Typedocument Form Service', () => {
  let service: TypedocumentFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypedocumentFormService);
  });

  describe('Service methods', () => {
    describe('createTypedocumentFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createTypedocumentFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nom: expect.any(Object),
            defautdest: expect.any(Object),
            defaultobject: expect.any(Object),
            defaultencopie: expect.any(Object),
            usualstatus: expect.any(Object),
          })
        );
      });

      it('passing ITypedocument should create a new form with FormGroup', () => {
        const formGroup = service.createTypedocumentFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nom: expect.any(Object),
            defautdest: expect.any(Object),
            defaultobject: expect.any(Object),
            defaultencopie: expect.any(Object),
            usualstatus: expect.any(Object),
          })
        );
      });
    });

    describe('getTypedocument', () => {
      it('should return NewTypedocument for default Typedocument initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createTypedocumentFormGroup(sampleWithNewData);

        const typedocument = service.getTypedocument(formGroup) as any;

        expect(typedocument).toMatchObject(sampleWithNewData);
      });

      it('should return NewTypedocument for empty Typedocument initial value', () => {
        const formGroup = service.createTypedocumentFormGroup();

        const typedocument = service.getTypedocument(formGroup) as any;

        expect(typedocument).toMatchObject({});
      });

      it('should return ITypedocument', () => {
        const formGroup = service.createTypedocumentFormGroup(sampleWithRequiredData);

        const typedocument = service.getTypedocument(formGroup) as any;

        expect(typedocument).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing ITypedocument should not enable id FormControl', () => {
        const formGroup = service.createTypedocumentFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewTypedocument should disable id FormControl', () => {
        const formGroup = service.createTypedocumentFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
