import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IDossier } from '../dossier.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../dossier.test-samples';

import { DossierService, RestDossier } from './dossier.service';

const requireRestSample: RestDossier = {
  ...sampleWithRequiredData,
  updatedDate: sampleWithRequiredData.updatedDate?.toJSON(),
};

describe('Dossier Service', () => {
  let service: DossierService;
  let httpMock: HttpTestingController;
  let expectedResult: IDossier | IDossier[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(DossierService);
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

    it('should create a Dossier', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dossier = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(dossier).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Dossier', () => {
      const dossier = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(dossier).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Dossier', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Dossier', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Dossier', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addDossierToCollectionIfMissing', () => {
      it('should add a Dossier to an empty array', () => {
        const dossier: IDossier = sampleWithRequiredData;
        expectedResult = service.addDossierToCollectionIfMissing([], dossier);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(dossier);
      });

      it('should not add a Dossier to an array that contains it', () => {
        const dossier: IDossier = sampleWithRequiredData;
        const dossierCollection: IDossier[] = [
          {
            ...dossier,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addDossierToCollectionIfMissing(dossierCollection, dossier);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Dossier to an array that doesn't contain it", () => {
        const dossier: IDossier = sampleWithRequiredData;
        const dossierCollection: IDossier[] = [sampleWithPartialData];
        expectedResult = service.addDossierToCollectionIfMissing(dossierCollection, dossier);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(dossier);
      });

      it('should add only unique Dossier to an array', () => {
        const dossierArray: IDossier[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const dossierCollection: IDossier[] = [sampleWithRequiredData];
        expectedResult = service.addDossierToCollectionIfMissing(dossierCollection, ...dossierArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const dossier: IDossier = sampleWithRequiredData;
        const dossier2: IDossier = sampleWithPartialData;
        expectedResult = service.addDossierToCollectionIfMissing([], dossier, dossier2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(dossier);
        expect(expectedResult).toContain(dossier2);
      });

      it('should accept null and undefined values', () => {
        const dossier: IDossier = sampleWithRequiredData;
        expectedResult = service.addDossierToCollectionIfMissing([], null, dossier, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(dossier);
      });

      it('should return initial array if no Dossier is added', () => {
        const dossierCollection: IDossier[] = [sampleWithRequiredData];
        expectedResult = service.addDossierToCollectionIfMissing(dossierCollection, undefined, null);
        expect(expectedResult).toEqual(dossierCollection);
      });
    });

    describe('compareDossier', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareDossier(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareDossier(entity1, entity2);
        const compareResult2 = service.compareDossier(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareDossier(entity1, entity2);
        const compareResult2 = service.compareDossier(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareDossier(entity1, entity2);
        const compareResult2 = service.compareDossier(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
