import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IPersonCompany } from '../person-company.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../person-company.test-samples';

import { PersonCompanyService } from './person-company.service';

const requireRestSample: IPersonCompany = {
  ...sampleWithRequiredData,
};

describe('PersonCompany Service', () => {
  let service: PersonCompanyService;
  let httpMock: HttpTestingController;
  let expectedResult: IPersonCompany | IPersonCompany[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(PersonCompanyService);
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

    it('should create a PersonCompany', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const personCompany = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(personCompany).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a PersonCompany', () => {
      const personCompany = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(personCompany).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a PersonCompany', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of PersonCompany', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a PersonCompany', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addPersonCompanyToCollectionIfMissing', () => {
      it('should add a PersonCompany to an empty array', () => {
        const personCompany: IPersonCompany = sampleWithRequiredData;
        expectedResult = service.addPersonCompanyToCollectionIfMissing([], personCompany);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(personCompany);
      });

      it('should not add a PersonCompany to an array that contains it', () => {
        const personCompany: IPersonCompany = sampleWithRequiredData;
        const personCompanyCollection: IPersonCompany[] = [
          {
            ...personCompany,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addPersonCompanyToCollectionIfMissing(personCompanyCollection, personCompany);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a PersonCompany to an array that doesn't contain it", () => {
        const personCompany: IPersonCompany = sampleWithRequiredData;
        const personCompanyCollection: IPersonCompany[] = [sampleWithPartialData];
        expectedResult = service.addPersonCompanyToCollectionIfMissing(personCompanyCollection, personCompany);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(personCompany);
      });

      it('should add only unique PersonCompany to an array', () => {
        const personCompanyArray: IPersonCompany[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const personCompanyCollection: IPersonCompany[] = [sampleWithRequiredData];
        expectedResult = service.addPersonCompanyToCollectionIfMissing(personCompanyCollection, ...personCompanyArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const personCompany: IPersonCompany = sampleWithRequiredData;
        const personCompany2: IPersonCompany = sampleWithPartialData;
        expectedResult = service.addPersonCompanyToCollectionIfMissing([], personCompany, personCompany2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(personCompany);
        expect(expectedResult).toContain(personCompany2);
      });

      it('should accept null and undefined values', () => {
        const personCompany: IPersonCompany = sampleWithRequiredData;
        expectedResult = service.addPersonCompanyToCollectionIfMissing([], null, personCompany, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(personCompany);
      });

      it('should return initial array if no PersonCompany is added', () => {
        const personCompanyCollection: IPersonCompany[] = [sampleWithRequiredData];
        expectedResult = service.addPersonCompanyToCollectionIfMissing(personCompanyCollection, undefined, null);
        expect(expectedResult).toEqual(personCompanyCollection);
      });
    });

    describe('comparePersonCompany', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.comparePersonCompany(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.comparePersonCompany(entity1, entity2);
        const compareResult2 = service.comparePersonCompany(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.comparePersonCompany(entity1, entity2);
        const compareResult2 = service.comparePersonCompany(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.comparePersonCompany(entity1, entity2);
        const compareResult2 = service.comparePersonCompany(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
