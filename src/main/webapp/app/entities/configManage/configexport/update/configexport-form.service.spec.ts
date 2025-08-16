import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../configexport.test-samples';

import { ConfigexportFormService } from './configexport-form.service';

describe('Configexport Form Service', () => {
  let service: ConfigexportFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigexportFormService);
  });

  describe('Service methods', () => {
    describe('createConfigexportFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createConfigexportFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            label: expect.any(Object),
            active: expect.any(Object),
            excelFile: expect.any(Object),
            dateCreated: expect.any(Object),
            configMappingJson: expect.any(Object),
            readAccess: expect.any(Object),
          })
        );
      });

      it('passing IConfigexport should create a new form with FormGroup', () => {
        const formGroup = service.createConfigexportFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            label: expect.any(Object),
            active: expect.any(Object),
            excelFile: expect.any(Object),
            dateCreated: expect.any(Object),
            configMappingJson: expect.any(Object),
            readAccess: expect.any(Object),
          })
        );
      });
    });

    describe('getConfigexport', () => {
      it('should return NewConfigexport for default Configexport initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createConfigexportFormGroup(sampleWithNewData);

        const configexport = service.getConfigexport(formGroup) as any;

        expect(configexport).toMatchObject(sampleWithNewData);
      });

      it('should return NewConfigexport for empty Configexport initial value', () => {
        const formGroup = service.createConfigexportFormGroup();

        const configexport = service.getConfigexport(formGroup) as any;

        expect(configexport).toMatchObject({});
      });

      it('should return IConfigexport', () => {
        const formGroup = service.createConfigexportFormGroup(sampleWithRequiredData);

        const configexport = service.getConfigexport(formGroup) as any;

        expect(configexport).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IConfigexport should not enable id FormControl', () => {
        const formGroup = service.createConfigexportFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewConfigexport should disable id FormControl', () => {
        const formGroup = service.createConfigexportFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
