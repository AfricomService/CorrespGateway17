import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../custom-search.test-samples';

import { CustomSearchFormService } from './custom-search-form.service';

describe('CustomSearch Form Service', () => {
  let service: CustomSearchFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomSearchFormService);
  });

  describe('Service methods', () => {
    describe('createCustomSearchFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createCustomSearchFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            dateCreation: expect.any(Object),
            readAccess: expect.any(Object),
            visibility: expect.any(Object),
            request: expect.any(Object),
            entitySearching: expect.any(Object),
            userLogin: expect.any(Object),
            name: expect.any(Object),
          })
        );
      });

      it('passing ICustomSearch should create a new form with FormGroup', () => {
        const formGroup = service.createCustomSearchFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            dateCreation: expect.any(Object),
            readAccess: expect.any(Object),
            visibility: expect.any(Object),
            request: expect.any(Object),
            entitySearching: expect.any(Object),
            userLogin: expect.any(Object),
            name: expect.any(Object),
          })
        );
      });
    });

    describe('getCustomSearch', () => {
      it('should return NewCustomSearch for default CustomSearch initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createCustomSearchFormGroup(sampleWithNewData);

        const customSearch = service.getCustomSearch(formGroup) as any;

        expect(customSearch).toMatchObject(sampleWithNewData);
      });

      it('should return NewCustomSearch for empty CustomSearch initial value', () => {
        const formGroup = service.createCustomSearchFormGroup();

        const customSearch = service.getCustomSearch(formGroup) as any;

        expect(customSearch).toMatchObject({});
      });

      it('should return ICustomSearch', () => {
        const formGroup = service.createCustomSearchFormGroup(sampleWithRequiredData);

        const customSearch = service.getCustomSearch(formGroup) as any;

        expect(customSearch).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing ICustomSearch should not enable id FormControl', () => {
        const formGroup = service.createCustomSearchFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewCustomSearch should disable id FormControl', () => {
        const formGroup = service.createCustomSearchFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
