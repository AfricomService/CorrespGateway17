import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IDepartement } from '../departement.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../departement.test-samples';

import { DepartementService, RestDepartement } from './departement.service';

const requireRestSample: RestDepartement = {
  ...sampleWithRequiredData,
  createdDate: sampleWithRequiredData.createdDate?.toJSON(),
  updatedDate: sampleWithRequiredData.updatedDate?.toJSON(),
};

describe('Departement Service', () => {
  let service: DepartementService;
  let httpMock: HttpTestingController;
  let expectedResult: IDepartement | IDepartement[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(DepartementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find(123).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Departement', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const departement = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(departement).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Departement', () => {
      const departement = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(departement).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Departement', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Departement', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Departement', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addDepartementToCollectionIfMissing', () => {
      it('should add a Departement to an empty array', () => {
        const departement: IDepartement = sampleWithRequiredData;
        expectedResult = service.addDepartementToCollectionIfMissing([], departement);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(departement);
      });

      it('should not add a Departement to an array that contains it', () => {
        const departement: IDepartement = sampleWithRequiredData;
        const departementCollection: IDepartement[] = [
          {
            ...departement,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addDepartementToCollectionIfMissing(departementCollection, departement);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Departement to an array that doesn't contain it", () => {
        const departement: IDepartement = sampleWithRequiredData;
        const departementCollection: IDepartement[] = [sampleWithPartialData];
        expectedResult = service.addDepartementToCollectionIfMissing(departementCollection, departement);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(departement);
      });

      it('should add only unique Departement to an array', () => {
        const departementArray: IDepartement[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const departementCollection: IDepartement[] = [sampleWithRequiredData];
        expectedResult = service.addDepartementToCollectionIfMissing(departementCollection, ...departementArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const departement: IDepartement = sampleWithRequiredData;
        const departement2: IDepartement = sampleWithPartialData;
        expectedResult = service.addDepartementToCollectionIfMissing([], departement, departement2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(departement);
        expect(expectedResult).toContain(departement2);
      });

      it('should accept null and undefined values', () => {
        const departement: IDepartement = sampleWithRequiredData;
        expectedResult = service.addDepartementToCollectionIfMissing([], null, departement, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(departement);
      });

      it('should return initial array if no Departement is added', () => {
        const departementCollection: IDepartement[] = [sampleWithRequiredData];
        expectedResult = service.addDepartementToCollectionIfMissing(departementCollection, undefined, null);
        expect(expectedResult).toEqual(departementCollection);
      });
    });

    describe('compareDepartement', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareDepartement(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareDepartement(entity1, entity2);
        const compareResult2 = service.compareDepartement(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareDepartement(entity1, entity2);
        const compareResult2 = service.compareDepartement(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareDepartement(entity1, entity2);
        const compareResult2 = service.compareDepartement(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
