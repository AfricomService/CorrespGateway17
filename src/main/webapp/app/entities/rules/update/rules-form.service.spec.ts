import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../rules.test-samples';

import { RulesFormService } from './rules-form.service';

describe('Rules Form Service', () => {
  let service: RulesFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RulesFormService);
  });

  describe('Service methods', () => {
    describe('createRulesFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createRulesFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            code: expect.any(Object),
            isActif: expect.any(Object),
            file: expect.any(Object),
          })
        );
      });

      it('passing IRules should create a new form with FormGroup', () => {
        const formGroup = service.createRulesFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            code: expect.any(Object),
            isActif: expect.any(Object),
            file: expect.any(Object),
          })
        );
      });
    });

    describe('getRules', () => {
      it('should return NewRules for default Rules initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createRulesFormGroup(sampleWithNewData);

        const rules = service.getRules(formGroup) as any;

        expect(rules).toMatchObject(sampleWithNewData);
      });

      it('should return NewRules for empty Rules initial value', () => {
        const formGroup = service.createRulesFormGroup();

        const rules = service.getRules(formGroup) as any;

        expect(rules).toMatchObject({});
      });

      it('should return IRules', () => {
        const formGroup = service.createRulesFormGroup(sampleWithRequiredData);

        const rules = service.getRules(formGroup) as any;

        expect(rules).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IRules should not enable id FormControl', () => {
        const formGroup = service.createRulesFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewRules should disable id FormControl', () => {
        const formGroup = service.createRulesFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
