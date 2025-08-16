import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../parent-classdef.test-samples';

import { ParentClassdefFormService } from './parent-classdef-form.service';

describe('ParentClassdef Form Service', () => {
  let service: ParentClassdefFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParentClassdefFormService);
  });

  describe('Service methods', () => {
    describe('createParentClassdefFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createParentClassdefFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            type: expect.any(Object),
            sequenceId: expect.any(Object),
          })
        );
      });

      it('passing IParentClassdef should create a new form with FormGroup', () => {
        const formGroup = service.createParentClassdefFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            type: expect.any(Object),
            sequenceId: expect.any(Object),
          })
        );
      });
    });

    describe('getParentClassdef', () => {
      it('should return NewParentClassdef for default ParentClassdef initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createParentClassdefFormGroup(sampleWithNewData);

        const parentClassdef = service.getParentClassdef(formGroup) as any;

        expect(parentClassdef).toMatchObject(sampleWithNewData);
      });

      it('should return NewParentClassdef for empty ParentClassdef initial value', () => {
        const formGroup = service.createParentClassdefFormGroup();

        const parentClassdef = service.getParentClassdef(formGroup) as any;

        expect(parentClassdef).toMatchObject({});
      });

      it('should return IParentClassdef', () => {
        const formGroup = service.createParentClassdefFormGroup(sampleWithRequiredData);

        const parentClassdef = service.getParentClassdef(formGroup) as any;

        expect(parentClassdef).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IParentClassdef should not enable id FormControl', () => {
        const formGroup = service.createParentClassdefFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewParentClassdef should disable id FormControl', () => {
        const formGroup = service.createParentClassdefFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
