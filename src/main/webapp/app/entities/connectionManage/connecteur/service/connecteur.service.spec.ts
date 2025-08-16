import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IConnecteur } from '../connecteur.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../connecteur.test-samples';

import { ConnecteurService } from './connecteur.service';

const requireRestSample: IConnecteur = {
  ...sampleWithRequiredData,
};

describe('Connecteur Service', () => {
  let service: ConnecteurService;
  let httpMock: HttpTestingController;
  let expectedResult: IConnecteur | IConnecteur[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(ConnecteurService);
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

    it('should create a Connecteur', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const connecteur = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(connecteur).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Connecteur', () => {
      const connecteur = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(connecteur).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Connecteur', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Connecteur', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Connecteur', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addConnecteurToCollectionIfMissing', () => {
      it('should add a Connecteur to an empty array', () => {
        const connecteur: IConnecteur = sampleWithRequiredData;
        expectedResult = service.addConnecteurToCollectionIfMissing([], connecteur);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(connecteur);
      });

      it('should not add a Connecteur to an array that contains it', () => {
        const connecteur: IConnecteur = sampleWithRequiredData;
        const connecteurCollection: IConnecteur[] = [
          {
            ...connecteur,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addConnecteurToCollectionIfMissing(connecteurCollection, connecteur);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Connecteur to an array that doesn't contain it", () => {
        const connecteur: IConnecteur = sampleWithRequiredData;
        const connecteurCollection: IConnecteur[] = [sampleWithPartialData];
        expectedResult = service.addConnecteurToCollectionIfMissing(connecteurCollection, connecteur);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(connecteur);
      });

      it('should add only unique Connecteur to an array', () => {
        const connecteurArray: IConnecteur[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const connecteurCollection: IConnecteur[] = [sampleWithRequiredData];
        expectedResult = service.addConnecteurToCollectionIfMissing(connecteurCollection, ...connecteurArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const connecteur: IConnecteur = sampleWithRequiredData;
        const connecteur2: IConnecteur = sampleWithPartialData;
        expectedResult = service.addConnecteurToCollectionIfMissing([], connecteur, connecteur2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(connecteur);
        expect(expectedResult).toContain(connecteur2);
      });

      it('should accept null and undefined values', () => {
        const connecteur: IConnecteur = sampleWithRequiredData;
        expectedResult = service.addConnecteurToCollectionIfMissing([], null, connecteur, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(connecteur);
      });

      it('should return initial array if no Connecteur is added', () => {
        const connecteurCollection: IConnecteur[] = [sampleWithRequiredData];
        expectedResult = service.addConnecteurToCollectionIfMissing(connecteurCollection, undefined, null);
        expect(expectedResult).toEqual(connecteurCollection);
      });
    });

    describe('compareConnecteur', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareConnecteur(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareConnecteur(entity1, entity2);
        const compareResult2 = service.compareConnecteur(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareConnecteur(entity1, entity2);
        const compareResult2 = service.compareConnecteur(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareConnecteur(entity1, entity2);
        const compareResult2 = service.compareConnecteur(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
