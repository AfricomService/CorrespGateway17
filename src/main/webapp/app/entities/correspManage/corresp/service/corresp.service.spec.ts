import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ICorresp } from '../corresp.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../corresp.test-samples';

import { CorrespService, RestCorresp } from './corresp.service';

const requireRestSample: RestCorresp = {
  ...sampleWithRequiredData,
  dateCreated: sampleWithRequiredData.dateCreated?.toJSON(),
  courrierDate: sampleWithRequiredData.courrierDate?.toJSON(),
  updatedDate: sampleWithRequiredData.updatedDate?.toJSON(),
};

describe('Corresp Service', () => {
  let service: CorrespService;
  let httpMock: HttpTestingController;
  let expectedResult: ICorresp | ICorresp[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(CorrespService);
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

    it('should create a Corresp', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const corresp = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(corresp).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Corresp', () => {
      const corresp = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(corresp).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Corresp', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Corresp', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Corresp', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addCorrespToCollectionIfMissing', () => {
      it('should add a Corresp to an empty array', () => {
        const corresp: ICorresp = sampleWithRequiredData;
        expectedResult = service.addCorrespToCollectionIfMissing([], corresp);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(corresp);
      });

      it('should not add a Corresp to an array that contains it', () => {
        const corresp: ICorresp = sampleWithRequiredData;
        const correspCollection: ICorresp[] = [
          {
            ...corresp,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addCorrespToCollectionIfMissing(correspCollection, corresp);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Corresp to an array that doesn't contain it", () => {
        const corresp: ICorresp = sampleWithRequiredData;
        const correspCollection: ICorresp[] = [sampleWithPartialData];
        expectedResult = service.addCorrespToCollectionIfMissing(correspCollection, corresp);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(corresp);
      });

      it('should add only unique Corresp to an array', () => {
        const correspArray: ICorresp[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const correspCollection: ICorresp[] = [sampleWithRequiredData];
        expectedResult = service.addCorrespToCollectionIfMissing(correspCollection, ...correspArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const corresp: ICorresp = sampleWithRequiredData;
        const corresp2: ICorresp = sampleWithPartialData;
        expectedResult = service.addCorrespToCollectionIfMissing([], corresp, corresp2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(corresp);
        expect(expectedResult).toContain(corresp2);
      });

      it('should accept null and undefined values', () => {
        const corresp: ICorresp = sampleWithRequiredData;
        expectedResult = service.addCorrespToCollectionIfMissing([], null, corresp, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(corresp);
      });

      it('should return initial array if no Corresp is added', () => {
        const correspCollection: ICorresp[] = [sampleWithRequiredData];
        expectedResult = service.addCorrespToCollectionIfMissing(correspCollection, undefined, null);
        expect(expectedResult).toEqual(correspCollection);
      });
    });

    describe('compareCorresp', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareCorresp(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareCorresp(entity1, entity2);
        const compareResult2 = service.compareCorresp(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareCorresp(entity1, entity2);
        const compareResult2 = service.compareCorresp(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareCorresp(entity1, entity2);
        const compareResult2 = service.compareCorresp(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
