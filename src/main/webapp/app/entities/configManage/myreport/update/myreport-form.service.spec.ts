import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../myreport.test-samples';

import { MyreportFormService } from './myreport-form.service';

describe('Myreport Form Service', () => {
  let service: MyreportFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyreportFormService);
  });

  describe('Service methods', () => {
    describe('createMyreportFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createMyreportFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            dateCreated: expect.any(Object),
            loginName: expect.any(Object),
            loginId: expect.any(Object),
            nameFile: expect.any(Object),
            nameFolder: expect.any(Object),
            configExportId: expect.any(Object),
            configexport: expect.any(Object),
          })
        );
      });

      it('passing IMyreport should create a new form with FormGroup', () => {
        const formGroup = service.createMyreportFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            dateCreated: expect.any(Object),
            loginName: expect.any(Object),
            loginId: expect.any(Object),
            nameFile: expect.any(Object),
            nameFolder: expect.any(Object),
            configExportId: expect.any(Object),
            configexport: expect.any(Object),
          })
        );
      });
    });

    describe('getMyreport', () => {
      it('should return NewMyreport for default Myreport initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createMyreportFormGroup(sampleWithNewData);

        const myreport = service.getMyreport(formGroup) as any;

        expect(myreport).toMatchObject(sampleWithNewData);
      });

      it('should return NewMyreport for empty Myreport initial value', () => {
        const formGroup = service.createMyreportFormGroup();

        const myreport = service.getMyreport(formGroup) as any;

        expect(myreport).toMatchObject({});
      });

      it('should return IMyreport', () => {
        const formGroup = service.createMyreportFormGroup(sampleWithRequiredData);

        const myreport = service.getMyreport(formGroup) as any;

        expect(myreport).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IMyreport should not enable id FormControl', () => {
        const formGroup = service.createMyreportFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewMyreport should disable id FormControl', () => {
        const formGroup = service.createMyreportFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
