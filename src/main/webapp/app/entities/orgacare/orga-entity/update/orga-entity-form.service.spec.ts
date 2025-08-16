import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../orga-entity.test-samples';

import { OrgaEntityFormService } from './orga-entity-form.service';

describe('OrgaEntity Form Service', () => {
  let service: OrgaEntityFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrgaEntityFormService);
  });

  describe('Service methods', () => {
    describe('createOrgaEntityFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createOrgaEntityFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            description: expect.any(Object),
            createdDate: expect.any(Object),
            updatedDate: expect.any(Object),
            departement: expect.any(Object),
            employe: expect.any(Object),
          })
        );
      });

      it('passing IOrgaEntity should create a new form with FormGroup', () => {
        const formGroup = service.createOrgaEntityFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            name: expect.any(Object),
            description: expect.any(Object),
            createdDate: expect.any(Object),
            updatedDate: expect.any(Object),
            departement: expect.any(Object),
            employe: expect.any(Object),
          })
        );
      });
    });

    describe('getOrgaEntity', () => {
      it('should return NewOrgaEntity for default OrgaEntity initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createOrgaEntityFormGroup(sampleWithNewData);

        const orgaEntity = service.getOrgaEntity(formGroup) as any;

        expect(orgaEntity).toMatchObject(sampleWithNewData);
      });

      it('should return NewOrgaEntity for empty OrgaEntity initial value', () => {
        const formGroup = service.createOrgaEntityFormGroup();

        const orgaEntity = service.getOrgaEntity(formGroup) as any;

        expect(orgaEntity).toMatchObject({});
      });

      it('should return IOrgaEntity', () => {
        const formGroup = service.createOrgaEntityFormGroup(sampleWithRequiredData);

        const orgaEntity = service.getOrgaEntity(formGroup) as any;

        expect(orgaEntity).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IOrgaEntity should not enable id FormControl', () => {
        const formGroup = service.createOrgaEntityFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewOrgaEntity should disable id FormControl', () => {
        const formGroup = service.createOrgaEntityFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
