import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../person-company.test-samples';

import { PersonCompanyFormService } from './person-company-form.service';

describe('PersonCompany Form Service', () => {
  let service: PersonCompanyFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonCompanyFormService);
  });

  describe('Service methods', () => {
    describe('createPersonCompanyFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createPersonCompanyFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nom: expect.any(Object),
            pays: expect.any(Object),
            adresse: expect.any(Object),
            tel: expect.any(Object),
            fax: expect.any(Object),
            email: expect.any(Object),
            whatsapp: expect.any(Object),
            etat: expect.any(Object),
          })
        );
      });

      it('passing IPersonCompany should create a new form with FormGroup', () => {
        const formGroup = service.createPersonCompanyFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nom: expect.any(Object),
            pays: expect.any(Object),
            adresse: expect.any(Object),
            tel: expect.any(Object),
            fax: expect.any(Object),
            email: expect.any(Object),
            whatsapp: expect.any(Object),
            etat: expect.any(Object),
          })
        );
      });
    });

    describe('getPersonCompany', () => {
      it('should return NewPersonCompany for default PersonCompany initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createPersonCompanyFormGroup(sampleWithNewData);

        const personCompany = service.getPersonCompany(formGroup) as any;

        expect(personCompany).toMatchObject(sampleWithNewData);
      });

      it('should return NewPersonCompany for empty PersonCompany initial value', () => {
        const formGroup = service.createPersonCompanyFormGroup();

        const personCompany = service.getPersonCompany(formGroup) as any;

        expect(personCompany).toMatchObject({});
      });

      it('should return IPersonCompany', () => {
        const formGroup = service.createPersonCompanyFormGroup(sampleWithRequiredData);

        const personCompany = service.getPersonCompany(formGroup) as any;

        expect(personCompany).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IPersonCompany should not enable id FormControl', () => {
        const formGroup = service.createPersonCompanyFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewPersonCompany should disable id FormControl', () => {
        const formGroup = service.createPersonCompanyFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
