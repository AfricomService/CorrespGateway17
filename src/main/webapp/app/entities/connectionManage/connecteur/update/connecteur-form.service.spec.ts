import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../connecteur.test-samples';

import { ConnecteurFormService } from './connecteur-form.service';

describe('Connecteur Form Service', () => {
  let service: ConnecteurFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnecteurFormService);
  });

  describe('Service methods', () => {
    describe('createConnecteurFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createConnecteurFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            codeRules: expect.any(Object),
            protocol: expect.any(Object),
            host: expect.any(Object),
            port: expect.any(Object),
            enable: expect.any(Object),
            email: expect.any(Object),
            password: expect.any(Object),
            folderSource: expect.any(Object),
            folderonOK: expect.any(Object),
            folderonError: expect.any(Object),
            isActif: expect.any(Object),
          })
        );
      });

      it('passing IConnecteur should create a new form with FormGroup', () => {
        const formGroup = service.createConnecteurFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            codeRules: expect.any(Object),
            protocol: expect.any(Object),
            host: expect.any(Object),
            port: expect.any(Object),
            enable: expect.any(Object),
            email: expect.any(Object),
            password: expect.any(Object),
            folderSource: expect.any(Object),
            folderonOK: expect.any(Object),
            folderonError: expect.any(Object),
            isActif: expect.any(Object),
          })
        );
      });
    });

    describe('getConnecteur', () => {
      it('should return NewConnecteur for default Connecteur initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createConnecteurFormGroup(sampleWithNewData);

        const connecteur = service.getConnecteur(formGroup) as any;

        expect(connecteur).toMatchObject(sampleWithNewData);
      });

      it('should return NewConnecteur for empty Connecteur initial value', () => {
        const formGroup = service.createConnecteurFormGroup();

        const connecteur = service.getConnecteur(formGroup) as any;

        expect(connecteur).toMatchObject({});
      });

      it('should return IConnecteur', () => {
        const formGroup = service.createConnecteurFormGroup(sampleWithRequiredData);

        const connecteur = service.getConnecteur(formGroup) as any;

        expect(connecteur).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IConnecteur should not enable id FormControl', () => {
        const formGroup = service.createConnecteurFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewConnecteur should disable id FormControl', () => {
        const formGroup = service.createConnecteurFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
