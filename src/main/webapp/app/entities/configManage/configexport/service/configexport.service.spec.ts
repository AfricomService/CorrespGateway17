import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IConfigexport } from '../configexport.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../configexport.test-samples';

import { ConfigexportService, RestConfigexport } from './configexport.service';

const requireRestSample: RestConfigexport = {
  ...sampleWithRequiredData,
  dateCreated: sampleWithRequiredData.dateCreated?.toJSON(),
};

describe('Configexport Service', () => {
  let service: ConfigexportService;
  let httpMock: HttpTestingController;
  let expectedResult: IConfigexport | IConfigexport[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(ConfigexportService);
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

    it('should create a Configexport', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const configexport = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(configexport).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Configexport', () => {
      const configexport = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(configexport).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Configexport', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Configexport', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Configexport', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addConfigexportToCollectionIfMissing', () => {
      it('should add a Configexport to an empty array', () => {
        const configexport: IConfigexport = sampleWithRequiredData;
        expectedResult = service.addConfigexportToCollectionIfMissing([], configexport);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(configexport);
      });

      it('should not add a Configexport to an array that contains it', () => {
        const configexport: IConfigexport = sampleWithRequiredData;
        const configexportCollection: IConfigexport[] = [
          {
            ...configexport,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addConfigexportToCollectionIfMissing(configexportCollection, configexport);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Configexport to an array that doesn't contain it", () => {
        const configexport: IConfigexport = sampleWithRequiredData;
        const configexportCollection: IConfigexport[] = [sampleWithPartialData];
        expectedResult = service.addConfigexportToCollectionIfMissing(configexportCollection, configexport);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(configexport);
      });

      it('should add only unique Configexport to an array', () => {
        const configexportArray: IConfigexport[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const configexportCollection: IConfigexport[] = [sampleWithRequiredData];
        expectedResult = service.addConfigexportToCollectionIfMissing(configexportCollection, ...configexportArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const configexport: IConfigexport = sampleWithRequiredData;
        const configexport2: IConfigexport = sampleWithPartialData;
        expectedResult = service.addConfigexportToCollectionIfMissing([], configexport, configexport2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(configexport);
        expect(expectedResult).toContain(configexport2);
      });

      it('should accept null and undefined values', () => {
        const configexport: IConfigexport = sampleWithRequiredData;
        expectedResult = service.addConfigexportToCollectionIfMissing([], null, configexport, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(configexport);
      });

      it('should return initial array if no Configexport is added', () => {
        const configexportCollection: IConfigexport[] = [sampleWithRequiredData];
        expectedResult = service.addConfigexportToCollectionIfMissing(configexportCollection, undefined, null);
        expect(expectedResult).toEqual(configexportCollection);
      });
    });

    describe('compareConfigexport', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareConfigexport(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareConfigexport(entity1, entity2);
        const compareResult2 = service.compareConfigexport(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareConfigexport(entity1, entity2);
        const compareResult2 = service.compareConfigexport(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareConfigexport(entity1, entity2);
        const compareResult2 = service.compareConfigexport(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
