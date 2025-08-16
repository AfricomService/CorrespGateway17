import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IMyreport } from '../myreport.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../myreport.test-samples';

import { MyreportService, RestMyreport } from './myreport.service';

const requireRestSample: RestMyreport = {
  ...sampleWithRequiredData,
  dateCreated: sampleWithRequiredData.dateCreated?.toJSON(),
};

describe('Myreport Service', () => {
  let service: MyreportService;
  let httpMock: HttpTestingController;
  let expectedResult: IMyreport | IMyreport[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(MyreportService);
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

    it('should create a Myreport', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const myreport = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(myreport).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Myreport', () => {
      const myreport = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(myreport).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Myreport', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Myreport', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Myreport', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addMyreportToCollectionIfMissing', () => {
      it('should add a Myreport to an empty array', () => {
        const myreport: IMyreport = sampleWithRequiredData;
        expectedResult = service.addMyreportToCollectionIfMissing([], myreport);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(myreport);
      });

      it('should not add a Myreport to an array that contains it', () => {
        const myreport: IMyreport = sampleWithRequiredData;
        const myreportCollection: IMyreport[] = [
          {
            ...myreport,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addMyreportToCollectionIfMissing(myreportCollection, myreport);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Myreport to an array that doesn't contain it", () => {
        const myreport: IMyreport = sampleWithRequiredData;
        const myreportCollection: IMyreport[] = [sampleWithPartialData];
        expectedResult = service.addMyreportToCollectionIfMissing(myreportCollection, myreport);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(myreport);
      });

      it('should add only unique Myreport to an array', () => {
        const myreportArray: IMyreport[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const myreportCollection: IMyreport[] = [sampleWithRequiredData];
        expectedResult = service.addMyreportToCollectionIfMissing(myreportCollection, ...myreportArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const myreport: IMyreport = sampleWithRequiredData;
        const myreport2: IMyreport = sampleWithPartialData;
        expectedResult = service.addMyreportToCollectionIfMissing([], myreport, myreport2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(myreport);
        expect(expectedResult).toContain(myreport2);
      });

      it('should accept null and undefined values', () => {
        const myreport: IMyreport = sampleWithRequiredData;
        expectedResult = service.addMyreportToCollectionIfMissing([], null, myreport, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(myreport);
      });

      it('should return initial array if no Myreport is added', () => {
        const myreportCollection: IMyreport[] = [sampleWithRequiredData];
        expectedResult = service.addMyreportToCollectionIfMissing(myreportCollection, undefined, null);
        expect(expectedResult).toEqual(myreportCollection);
      });
    });

    describe('compareMyreport', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareMyreport(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareMyreport(entity1, entity2);
        const compareResult2 = service.compareMyreport(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareMyreport(entity1, entity2);
        const compareResult2 = service.compareMyreport(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareMyreport(entity1, entity2);
        const compareResult2 = service.compareMyreport(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
