import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IParentClassdef } from '../parent-classdef.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../parent-classdef.test-samples';

import { ParentClassdefService } from './parent-classdef.service';

const requireRestSample: IParentClassdef = {
  ...sampleWithRequiredData,
};

describe('ParentClassdef Service', () => {
  let service: ParentClassdefService;
  let httpMock: HttpTestingController;
  let expectedResult: IParentClassdef | IParentClassdef[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(ParentClassdefService);
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

    it('should create a ParentClassdef', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const parentClassdef = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(parentClassdef).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a ParentClassdef', () => {
      const parentClassdef = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(parentClassdef).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a ParentClassdef', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of ParentClassdef', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a ParentClassdef', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addParentClassdefToCollectionIfMissing', () => {
      it('should add a ParentClassdef to an empty array', () => {
        const parentClassdef: IParentClassdef = sampleWithRequiredData;
        expectedResult = service.addParentClassdefToCollectionIfMissing([], parentClassdef);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(parentClassdef);
      });

      it('should not add a ParentClassdef to an array that contains it', () => {
        const parentClassdef: IParentClassdef = sampleWithRequiredData;
        const parentClassdefCollection: IParentClassdef[] = [
          {
            ...parentClassdef,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addParentClassdefToCollectionIfMissing(parentClassdefCollection, parentClassdef);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a ParentClassdef to an array that doesn't contain it", () => {
        const parentClassdef: IParentClassdef = sampleWithRequiredData;
        const parentClassdefCollection: IParentClassdef[] = [sampleWithPartialData];
        expectedResult = service.addParentClassdefToCollectionIfMissing(parentClassdefCollection, parentClassdef);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(parentClassdef);
      });

      it('should add only unique ParentClassdef to an array', () => {
        const parentClassdefArray: IParentClassdef[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const parentClassdefCollection: IParentClassdef[] = [sampleWithRequiredData];
        expectedResult = service.addParentClassdefToCollectionIfMissing(parentClassdefCollection, ...parentClassdefArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const parentClassdef: IParentClassdef = sampleWithRequiredData;
        const parentClassdef2: IParentClassdef = sampleWithPartialData;
        expectedResult = service.addParentClassdefToCollectionIfMissing([], parentClassdef, parentClassdef2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(parentClassdef);
        expect(expectedResult).toContain(parentClassdef2);
      });

      it('should accept null and undefined values', () => {
        const parentClassdef: IParentClassdef = sampleWithRequiredData;
        expectedResult = service.addParentClassdefToCollectionIfMissing([], null, parentClassdef, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(parentClassdef);
      });

      it('should return initial array if no ParentClassdef is added', () => {
        const parentClassdefCollection: IParentClassdef[] = [sampleWithRequiredData];
        expectedResult = service.addParentClassdefToCollectionIfMissing(parentClassdefCollection, undefined, null);
        expect(expectedResult).toEqual(parentClassdefCollection);
      });
    });

    describe('compareParentClassdef', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareParentClassdef(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareParentClassdef(entity1, entity2);
        const compareResult2 = service.compareParentClassdef(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareParentClassdef(entity1, entity2);
        const compareResult2 = service.compareParentClassdef(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareParentClassdef(entity1, entity2);
        const compareResult2 = service.compareParentClassdef(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
