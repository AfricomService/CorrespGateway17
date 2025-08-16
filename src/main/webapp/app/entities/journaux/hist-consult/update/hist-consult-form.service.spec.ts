import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../hist-consult.test-samples';

import { HistConsultFormService } from './hist-consult-form.service';

describe('HistConsult Form Service', () => {
  let service: HistConsultFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistConsultFormService);
  });

  describe('Service methods', () => {
    describe('createHistConsultFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createHistConsultFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            labelAction: expect.any(Object),
            user: expect.any(Object),
            dateTransaction: expect.any(Object),
            categorie: expect.any(Object),
            navigateur: expect.any(Object),
            ip: expect.any(Object),
            terminal: expect.any(Object),
          })
        );
      });

      it('passing IHistConsult should create a new form with FormGroup', () => {
        const formGroup = service.createHistConsultFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            labelAction: expect.any(Object),
            user: expect.any(Object),
            dateTransaction: expect.any(Object),
            categorie: expect.any(Object),
            navigateur: expect.any(Object),
            ip: expect.any(Object),
            terminal: expect.any(Object),
          })
        );
      });
    });

    describe('getHistConsult', () => {
      it('should return NewHistConsult for default HistConsult initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createHistConsultFormGroup(sampleWithNewData);

        const histConsult = service.getHistConsult(formGroup) as any;

        expect(histConsult).toMatchObject(sampleWithNewData);
      });

      it('should return NewHistConsult for empty HistConsult initial value', () => {
        const formGroup = service.createHistConsultFormGroup();

        const histConsult = service.getHistConsult(formGroup) as any;

        expect(histConsult).toMatchObject({});
      });

      it('should return IHistConsult', () => {
        const formGroup = service.createHistConsultFormGroup(sampleWithRequiredData);

        const histConsult = service.getHistConsult(formGroup) as any;

        expect(histConsult).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IHistConsult should not enable id FormControl', () => {
        const formGroup = service.createHistConsultFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewHistConsult should disable id FormControl', () => {
        const formGroup = service.createHistConsultFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
