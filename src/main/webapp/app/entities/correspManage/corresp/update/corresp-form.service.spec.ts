import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../corresp.test-samples';

import { CorrespFormService } from './corresp-form.service';

describe('Corresp Form Service', () => {
  let service: CorrespFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CorrespFormService);
  });

  describe('Service methods', () => {
    describe('createCorrespFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createCorrespFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            idinstance: expect.any(Object),
            reference: expect.any(Object),
            subject: expect.any(Object),
            dateCreated: expect.any(Object),
            courrierDate: expect.any(Object),
            status: expect.any(Object),
            priority: expect.any(Object),
            body: expect.any(Object),
            corresptype: expect.any(Object),
            sender: expect.any(Object),
            needsResponse: expect.any(Object),
            responseTo: expect.any(Object),
            step: expect.any(Object),
            stepCode: expect.any(Object),
            processId: expect.any(Object),
            processVersion: expect.any(Object),
            contact: expect.any(Object),
            senderReference: expect.any(Object),
            dispatchType: expect.any(Object),
            contactCompany: expect.any(Object),
            personCompany: expect.any(Object),
            contactAddress: expect.any(Object),
            contactEmail: expect.any(Object),
            contactEmailCc: expect.any(Object),
            createdBy: expect.any(Object),
            updatedBy: expect.any(Object),
            updatedDate: expect.any(Object),
            dossiers: expect.any(Object),
            bordereaux: expect.any(Object),
            attachments: expect.any(Object),
            tasks: expect.any(Object),
          })
        );
      });

      it('passing ICorresp should create a new form with FormGroup', () => {
        const formGroup = service.createCorrespFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            idinstance: expect.any(Object),
            reference: expect.any(Object),
            subject: expect.any(Object),
            dateCreated: expect.any(Object),
            courrierDate: expect.any(Object),
            status: expect.any(Object),
            priority: expect.any(Object),
            body: expect.any(Object),
            corresptype: expect.any(Object),
            sender: expect.any(Object),
            needsResponse: expect.any(Object),
            responseTo: expect.any(Object),
            step: expect.any(Object),
            stepCode: expect.any(Object),
            processId: expect.any(Object),
            processVersion: expect.any(Object),
            contact: expect.any(Object),
            senderReference: expect.any(Object),
            dispatchType: expect.any(Object),
            contactCompany: expect.any(Object),
            personCompany: expect.any(Object),
            contactAddress: expect.any(Object),
            contactEmail: expect.any(Object),
            contactEmailCc: expect.any(Object),
            createdBy: expect.any(Object),
            updatedBy: expect.any(Object),
            updatedDate: expect.any(Object),
            dossiers: expect.any(Object),
            bordereaux: expect.any(Object),
            attachments: expect.any(Object),
            tasks: expect.any(Object),
          })
        );
      });
    });

    describe('getCorresp', () => {
      it('should return NewCorresp for default Corresp initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createCorrespFormGroup(sampleWithNewData);

        const corresp = service.getCorresp(formGroup) as any;

        expect(corresp).toMatchObject(sampleWithNewData);
      });

      it('should return NewCorresp for empty Corresp initial value', () => {
        const formGroup = service.createCorrespFormGroup();

        const corresp = service.getCorresp(formGroup) as any;

        expect(corresp).toMatchObject({});
      });

      it('should return ICorresp', () => {
        const formGroup = service.createCorrespFormGroup(sampleWithRequiredData);

        const corresp = service.getCorresp(formGroup) as any;

        expect(corresp).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing ICorresp should not enable id FormControl', () => {
        const formGroup = service.createCorrespFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewCorresp should disable id FormControl', () => {
        const formGroup = service.createCorrespFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
