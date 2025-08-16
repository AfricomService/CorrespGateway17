import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../contact-company.test-samples';

import { ContactCompanyFormService } from './contact-company-form.service';

describe('ContactCompany Form Service', () => {
  let service: ContactCompanyFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactCompanyFormService);
  });

  describe('Service methods', () => {
    describe('createContactCompanyFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createContactCompanyFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nom: expect.any(Object),
            nomabrege: expect.any(Object),
            matrne: expect.any(Object),
            pays: expect.any(Object),
            adresse: expect.any(Object),
            tel: expect.any(Object),
            fax: expect.any(Object),
            email: expect.any(Object),
            webpage: expect.any(Object),
            etat: expect.any(Object),
          })
        );
      });

      it('passing IContactCompany should create a new form with FormGroup', () => {
        const formGroup = service.createContactCompanyFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nom: expect.any(Object),
            nomabrege: expect.any(Object),
            matrne: expect.any(Object),
            pays: expect.any(Object),
            adresse: expect.any(Object),
            tel: expect.any(Object),
            fax: expect.any(Object),
            email: expect.any(Object),
            webpage: expect.any(Object),
            etat: expect.any(Object),
          })
        );
      });
    });

    describe('getContactCompany', () => {
      it('should return NewContactCompany for default ContactCompany initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createContactCompanyFormGroup(sampleWithNewData);

        const contactCompany = service.getContactCompany(formGroup) as any;

        expect(contactCompany).toMatchObject(sampleWithNewData);
      });

      it('should return NewContactCompany for empty ContactCompany initial value', () => {
        const formGroup = service.createContactCompanyFormGroup();

        const contactCompany = service.getContactCompany(formGroup) as any;

        expect(contactCompany).toMatchObject({});
      });

      it('should return IContactCompany', () => {
        const formGroup = service.createContactCompanyFormGroup(sampleWithRequiredData);

        const contactCompany = service.getContactCompany(formGroup) as any;

        expect(contactCompany).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IContactCompany should not enable id FormControl', () => {
        const formGroup = service.createContactCompanyFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewContactCompany should disable id FormControl', () => {
        const formGroup = service.createContactCompanyFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
