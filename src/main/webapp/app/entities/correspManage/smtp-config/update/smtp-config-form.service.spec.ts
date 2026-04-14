import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../smtp-config.test-samples';

import { SmtpConfigFormService } from './smtp-config-form.service';

describe('SmtpConfig Form Service', () => {
  let service: SmtpConfigFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmtpConfigFormService);
  });

  describe('Service methods', () => {
    describe('createSmtpConfigFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createSmtpConfigFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            smtpHost: expect.any(Object),
            smtpPort: expect.any(Object),
            username: expect.any(Object),
            password: expect.any(Object),
            useAuth: expect.any(Object),
            useTls: expect.any(Object),
            useSsl: expect.any(Object),
            fromAddress: expect.any(Object),
            fromName: expect.any(Object),
            lacalhostName: expect.any(Object),
            connectionTimeout: expect.any(Object),
            timeout: expect.any(Object),
            active: expect.any(Object),
            description: expect.any(Object),
          })
        );
      });

      it('passing ISmtpConfig should create a new form with FormGroup', () => {
        const formGroup = service.createSmtpConfigFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            smtpHost: expect.any(Object),
            smtpPort: expect.any(Object),
            username: expect.any(Object),
            password: expect.any(Object),
            useAuth: expect.any(Object),
            useTls: expect.any(Object),
            useSsl: expect.any(Object),
            fromAddress: expect.any(Object),
            fromName: expect.any(Object),
            lacalhostName: expect.any(Object),
            connectionTimeout: expect.any(Object),
            timeout: expect.any(Object),
            active: expect.any(Object),
            description: expect.any(Object),
          })
        );
      });
    });

    describe('getSmtpConfig', () => {
      it('should return NewSmtpConfig for default SmtpConfig initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createSmtpConfigFormGroup(sampleWithNewData);

        const smtpConfig = service.getSmtpConfig(formGroup) as any;

        expect(smtpConfig).toMatchObject(sampleWithNewData);
      });

      it('should return NewSmtpConfig for empty SmtpConfig initial value', () => {
        const formGroup = service.createSmtpConfigFormGroup();

        const smtpConfig = service.getSmtpConfig(formGroup) as any;

        expect(smtpConfig).toMatchObject({});
      });

      it('should return ISmtpConfig', () => {
        const formGroup = service.createSmtpConfigFormGroup(sampleWithRequiredData);

        const smtpConfig = service.getSmtpConfig(formGroup) as any;

        expect(smtpConfig).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing ISmtpConfig should not enable id FormControl', () => {
        const formGroup = service.createSmtpConfigFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewSmtpConfig should disable id FormControl', () => {
        const formGroup = service.createSmtpConfigFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
