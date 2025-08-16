import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IHistConsult } from '../hist-consult.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../hist-consult.test-samples';

import { HistConsultService, RestHistConsult } from './hist-consult.service';

const requireRestSample: RestHistConsult = {
  ...sampleWithRequiredData,
  dateTransaction: sampleWithRequiredData.dateTransaction?.toJSON(),
};

describe('HistConsult Service', () => {
  let service: HistConsultService;
  let httpMock: HttpTestingController;
  let expectedResult: IHistConsult | IHistConsult[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(HistConsultService);
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

    it('should create a HistConsult', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const histConsult = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(histConsult).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a HistConsult', () => {
      const histConsult = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(histConsult).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a HistConsult', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of HistConsult', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a HistConsult', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addHistConsultToCollectionIfMissing', () => {
      it('should add a HistConsult to an empty array', () => {
        const histConsult: IHistConsult = sampleWithRequiredData;
        expectedResult = service.addHistConsultToCollectionIfMissing([], histConsult);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(histConsult);
      });

      it('should not add a HistConsult to an array that contains it', () => {
        const histConsult: IHistConsult = sampleWithRequiredData;
        const histConsultCollection: IHistConsult[] = [
          {
            ...histConsult,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addHistConsultToCollectionIfMissing(histConsultCollection, histConsult);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a HistConsult to an array that doesn't contain it", () => {
        const histConsult: IHistConsult = sampleWithRequiredData;
        const histConsultCollection: IHistConsult[] = [sampleWithPartialData];
        expectedResult = service.addHistConsultToCollectionIfMissing(histConsultCollection, histConsult);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(histConsult);
      });

      it('should add only unique HistConsult to an array', () => {
        const histConsultArray: IHistConsult[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const histConsultCollection: IHistConsult[] = [sampleWithRequiredData];
        expectedResult = service.addHistConsultToCollectionIfMissing(histConsultCollection, ...histConsultArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const histConsult: IHistConsult = sampleWithRequiredData;
        const histConsult2: IHistConsult = sampleWithPartialData;
        expectedResult = service.addHistConsultToCollectionIfMissing([], histConsult, histConsult2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(histConsult);
        expect(expectedResult).toContain(histConsult2);
      });

      it('should accept null and undefined values', () => {
        const histConsult: IHistConsult = sampleWithRequiredData;
        expectedResult = service.addHistConsultToCollectionIfMissing([], null, histConsult, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(histConsult);
      });

      it('should return initial array if no HistConsult is added', () => {
        const histConsultCollection: IHistConsult[] = [sampleWithRequiredData];
        expectedResult = service.addHistConsultToCollectionIfMissing(histConsultCollection, undefined, null);
        expect(expectedResult).toEqual(histConsultCollection);
      });
    });

    describe('compareHistConsult', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareHistConsult(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareHistConsult(entity1, entity2);
        const compareResult2 = service.compareHistConsult(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareHistConsult(entity1, entity2);
        const compareResult2 = service.compareHistConsult(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareHistConsult(entity1, entity2);
        const compareResult2 = service.compareHistConsult(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
