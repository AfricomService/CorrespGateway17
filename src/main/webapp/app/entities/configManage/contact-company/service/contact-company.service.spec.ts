import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IContactCompany } from '../contact-company.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../contact-company.test-samples';

import { ContactCompanyService } from './contact-company.service';

const requireRestSample: IContactCompany = {
  ...sampleWithRequiredData,
};

describe('ContactCompany Service', () => {
  let service: ContactCompanyService;
  let httpMock: HttpTestingController;
  let expectedResult: IContactCompany | IContactCompany[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(ContactCompanyService);
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

    it('should create a ContactCompany', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const contactCompany = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(contactCompany).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a ContactCompany', () => {
      const contactCompany = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(contactCompany).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a ContactCompany', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of ContactCompany', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a ContactCompany', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addContactCompanyToCollectionIfMissing', () => {
      it('should add a ContactCompany to an empty array', () => {
        const contactCompany: IContactCompany = sampleWithRequiredData;
        expectedResult = service.addContactCompanyToCollectionIfMissing([], contactCompany);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(contactCompany);
      });

      it('should not add a ContactCompany to an array that contains it', () => {
        const contactCompany: IContactCompany = sampleWithRequiredData;
        const contactCompanyCollection: IContactCompany[] = [
          {
            ...contactCompany,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addContactCompanyToCollectionIfMissing(contactCompanyCollection, contactCompany);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a ContactCompany to an array that doesn't contain it", () => {
        const contactCompany: IContactCompany = sampleWithRequiredData;
        const contactCompanyCollection: IContactCompany[] = [sampleWithPartialData];
        expectedResult = service.addContactCompanyToCollectionIfMissing(contactCompanyCollection, contactCompany);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(contactCompany);
      });

      it('should add only unique ContactCompany to an array', () => {
        const contactCompanyArray: IContactCompany[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const contactCompanyCollection: IContactCompany[] = [sampleWithRequiredData];
        expectedResult = service.addContactCompanyToCollectionIfMissing(contactCompanyCollection, ...contactCompanyArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const contactCompany: IContactCompany = sampleWithRequiredData;
        const contactCompany2: IContactCompany = sampleWithPartialData;
        expectedResult = service.addContactCompanyToCollectionIfMissing([], contactCompany, contactCompany2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(contactCompany);
        expect(expectedResult).toContain(contactCompany2);
      });

      it('should accept null and undefined values', () => {
        const contactCompany: IContactCompany = sampleWithRequiredData;
        expectedResult = service.addContactCompanyToCollectionIfMissing([], null, contactCompany, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(contactCompany);
      });

      it('should return initial array if no ContactCompany is added', () => {
        const contactCompanyCollection: IContactCompany[] = [sampleWithRequiredData];
        expectedResult = service.addContactCompanyToCollectionIfMissing(contactCompanyCollection, undefined, null);
        expect(expectedResult).toEqual(contactCompanyCollection);
      });
    });

    describe('compareContactCompany', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareContactCompany(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareContactCompany(entity1, entity2);
        const compareResult2 = service.compareContactCompany(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareContactCompany(entity1, entity2);
        const compareResult2 = service.compareContactCompany(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareContactCompany(entity1, entity2);
        const compareResult2 = service.compareContactCompany(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
