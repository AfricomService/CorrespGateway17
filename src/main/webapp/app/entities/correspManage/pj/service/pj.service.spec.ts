import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IPj } from '../pj.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../pj.test-samples';

import { PjService, RestPj } from './pj.service';

const requireRestSample: RestPj = {
  ...sampleWithRequiredData,
  creationDate: sampleWithRequiredData.creationDate?.toJSON(),
  updatedDate: sampleWithRequiredData.updatedDate?.toJSON(),
};

describe('Pj Service', () => {
  let service: PjService;
  let httpMock: HttpTestingController;
  let expectedResult: IPj | IPj[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(PjService);
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

    it('should create a Pj', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const pj = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(pj).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Pj', () => {
      const pj = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(pj).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Pj', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Pj', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Pj', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addPjToCollectionIfMissing', () => {
      it('should add a Pj to an empty array', () => {
        const pj: IPj = sampleWithRequiredData;
        expectedResult = service.addPjToCollectionIfMissing([], pj);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(pj);
      });

      it('should not add a Pj to an array that contains it', () => {
        const pj: IPj = sampleWithRequiredData;
        const pjCollection: IPj[] = [
          {
            ...pj,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addPjToCollectionIfMissing(pjCollection, pj);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Pj to an array that doesn't contain it", () => {
        const pj: IPj = sampleWithRequiredData;
        const pjCollection: IPj[] = [sampleWithPartialData];
        expectedResult = service.addPjToCollectionIfMissing(pjCollection, pj);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(pj);
      });

      it('should add only unique Pj to an array', () => {
        const pjArray: IPj[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const pjCollection: IPj[] = [sampleWithRequiredData];
        expectedResult = service.addPjToCollectionIfMissing(pjCollection, ...pjArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const pj: IPj = sampleWithRequiredData;
        const pj2: IPj = sampleWithPartialData;
        expectedResult = service.addPjToCollectionIfMissing([], pj, pj2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(pj);
        expect(expectedResult).toContain(pj2);
      });

      it('should accept null and undefined values', () => {
        const pj: IPj = sampleWithRequiredData;
        expectedResult = service.addPjToCollectionIfMissing([], null, pj, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(pj);
      });

      it('should return initial array if no Pj is added', () => {
        const pjCollection: IPj[] = [sampleWithRequiredData];
        expectedResult = service.addPjToCollectionIfMissing(pjCollection, undefined, null);
        expect(expectedResult).toEqual(pjCollection);
      });
    });

    describe('comparePj', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.comparePj(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.comparePj(entity1, entity2);
        const compareResult2 = service.comparePj(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.comparePj(entity1, entity2);
        const compareResult2 = service.comparePj(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.comparePj(entity1, entity2);
        const compareResult2 = service.comparePj(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
