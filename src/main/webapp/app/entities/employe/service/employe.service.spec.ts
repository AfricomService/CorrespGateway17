import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IEmploye } from '../employe.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../employe.test-samples';

import { EmployeService } from './employe.service';

const requireRestSample: IEmploye = {
  ...sampleWithRequiredData,
};

describe('Employe Service', () => {
  let service: EmployeService;
  let httpMock: HttpTestingController;
  let expectedResult: IEmploye | IEmploye[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(EmployeService);
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

    it('should create a Employe', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const employe = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(employe).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Employe', () => {
      const employe = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(employe).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Employe', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Employe', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Employe', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addEmployeToCollectionIfMissing', () => {
      it('should add a Employe to an empty array', () => {
        const employe: IEmploye = sampleWithRequiredData;
        expectedResult = service.addEmployeToCollectionIfMissing([], employe);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(employe);
      });

      it('should not add a Employe to an array that contains it', () => {
        const employe: IEmploye = sampleWithRequiredData;
        const employeCollection: IEmploye[] = [
          {
            ...employe,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addEmployeToCollectionIfMissing(employeCollection, employe);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Employe to an array that doesn't contain it", () => {
        const employe: IEmploye = sampleWithRequiredData;
        const employeCollection: IEmploye[] = [sampleWithPartialData];
        expectedResult = service.addEmployeToCollectionIfMissing(employeCollection, employe);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(employe);
      });

      it('should add only unique Employe to an array', () => {
        const employeArray: IEmploye[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const employeCollection: IEmploye[] = [sampleWithRequiredData];
        expectedResult = service.addEmployeToCollectionIfMissing(employeCollection, ...employeArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const employe: IEmploye = sampleWithRequiredData;
        const employe2: IEmploye = sampleWithPartialData;
        expectedResult = service.addEmployeToCollectionIfMissing([], employe, employe2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(employe);
        expect(expectedResult).toContain(employe2);
      });

      it('should accept null and undefined values', () => {
        const employe: IEmploye = sampleWithRequiredData;
        expectedResult = service.addEmployeToCollectionIfMissing([], null, employe, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(employe);
      });

      it('should return initial array if no Employe is added', () => {
        const employeCollection: IEmploye[] = [sampleWithRequiredData];
        expectedResult = service.addEmployeToCollectionIfMissing(employeCollection, undefined, null);
        expect(expectedResult).toEqual(employeCollection);
      });
    });

    describe('compareEmploye', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareEmploye(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareEmploye(entity1, entity2);
        const compareResult2 = service.compareEmploye(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareEmploye(entity1, entity2);
        const compareResult2 = service.compareEmploye(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareEmploye(entity1, entity2);
        const compareResult2 = service.compareEmploye(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
