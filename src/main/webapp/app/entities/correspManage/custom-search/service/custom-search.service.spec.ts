import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ICustomSearch } from '../custom-search.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../custom-search.test-samples';

import { CustomSearchService, RestCustomSearch } from './custom-search.service';

const requireRestSample: RestCustomSearch = {
  ...sampleWithRequiredData,
  dateCreation: sampleWithRequiredData.dateCreation?.toJSON(),
};

describe('CustomSearch Service', () => {
  let service: CustomSearchService;
  let httpMock: HttpTestingController;
  let expectedResult: ICustomSearch | ICustomSearch[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(CustomSearchService);
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

    it('should create a CustomSearch', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const customSearch = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(customSearch).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a CustomSearch', () => {
      const customSearch = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(customSearch).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a CustomSearch', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of CustomSearch', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a CustomSearch', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addCustomSearchToCollectionIfMissing', () => {
      it('should add a CustomSearch to an empty array', () => {
        const customSearch: ICustomSearch = sampleWithRequiredData;
        expectedResult = service.addCustomSearchToCollectionIfMissing([], customSearch);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(customSearch);
      });

      it('should not add a CustomSearch to an array that contains it', () => {
        const customSearch: ICustomSearch = sampleWithRequiredData;
        const customSearchCollection: ICustomSearch[] = [
          {
            ...customSearch,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addCustomSearchToCollectionIfMissing(customSearchCollection, customSearch);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a CustomSearch to an array that doesn't contain it", () => {
        const customSearch: ICustomSearch = sampleWithRequiredData;
        const customSearchCollection: ICustomSearch[] = [sampleWithPartialData];
        expectedResult = service.addCustomSearchToCollectionIfMissing(customSearchCollection, customSearch);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(customSearch);
      });

      it('should add only unique CustomSearch to an array', () => {
        const customSearchArray: ICustomSearch[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const customSearchCollection: ICustomSearch[] = [sampleWithRequiredData];
        expectedResult = service.addCustomSearchToCollectionIfMissing(customSearchCollection, ...customSearchArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const customSearch: ICustomSearch = sampleWithRequiredData;
        const customSearch2: ICustomSearch = sampleWithPartialData;
        expectedResult = service.addCustomSearchToCollectionIfMissing([], customSearch, customSearch2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(customSearch);
        expect(expectedResult).toContain(customSearch2);
      });

      it('should accept null and undefined values', () => {
        const customSearch: ICustomSearch = sampleWithRequiredData;
        expectedResult = service.addCustomSearchToCollectionIfMissing([], null, customSearch, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(customSearch);
      });

      it('should return initial array if no CustomSearch is added', () => {
        const customSearchCollection: ICustomSearch[] = [sampleWithRequiredData];
        expectedResult = service.addCustomSearchToCollectionIfMissing(customSearchCollection, undefined, null);
        expect(expectedResult).toEqual(customSearchCollection);
      });
    });

    describe('compareCustomSearch', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareCustomSearch(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareCustomSearch(entity1, entity2);
        const compareResult2 = service.compareCustomSearch(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareCustomSearch(entity1, entity2);
        const compareResult2 = service.compareCustomSearch(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareCustomSearch(entity1, entity2);
        const compareResult2 = service.compareCustomSearch(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
