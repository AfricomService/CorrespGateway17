import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { INotif } from '../notif.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../notif.test-samples';

import { NotifService, RestNotif } from './notif.service';

const requireRestSample: RestNotif = {
  ...sampleWithRequiredData,
  sentDate: sampleWithRequiredData.sentDate?.toJSON(),
};

describe('Notif Service', () => {
  let service: NotifService;
  let httpMock: HttpTestingController;
  let expectedResult: INotif | INotif[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(NotifService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Notif', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const notif = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(notif).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Notif', () => {
      const notif = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(notif).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Notif', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Notif', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Notif', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addNotifToCollectionIfMissing', () => {
      it('should add a Notif to an empty array', () => {
        const notif: INotif = sampleWithRequiredData;
        expectedResult = service.addNotifToCollectionIfMissing([], notif);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(notif);
      });

      it('should not add a Notif to an array that contains it', () => {
        const notif: INotif = sampleWithRequiredData;
        const notifCollection: INotif[] = [
          {
            ...notif,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addNotifToCollectionIfMissing(notifCollection, notif);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Notif to an array that doesn't contain it", () => {
        const notif: INotif = sampleWithRequiredData;
        const notifCollection: INotif[] = [sampleWithPartialData];
        expectedResult = service.addNotifToCollectionIfMissing(notifCollection, notif);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(notif);
      });

      it('should add only unique Notif to an array', () => {
        const notifArray: INotif[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const notifCollection: INotif[] = [sampleWithRequiredData];
        expectedResult = service.addNotifToCollectionIfMissing(notifCollection, ...notifArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const notif: INotif = sampleWithRequiredData;
        const notif2: INotif = sampleWithPartialData;
        expectedResult = service.addNotifToCollectionIfMissing([], notif, notif2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(notif);
        expect(expectedResult).toContain(notif2);
      });

      it('should accept null and undefined values', () => {
        const notif: INotif = sampleWithRequiredData;
        expectedResult = service.addNotifToCollectionIfMissing([], null, notif, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(notif);
      });

      it('should return initial array if no Notif is added', () => {
        const notifCollection: INotif[] = [sampleWithRequiredData];
        expectedResult = service.addNotifToCollectionIfMissing(notifCollection, undefined, null);
        expect(expectedResult).toEqual(notifCollection);
      });
    });

    describe('compareNotif', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareNotif(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = null;

        const compareResult1 = service.compareNotif(entity1, entity2);
        const compareResult2 = service.compareNotif(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

        const compareResult1 = service.compareNotif(entity1, entity2);
        const compareResult2 = service.compareNotif(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };

        const compareResult1 = service.compareNotif(entity1, entity2);
        const compareResult2 = service.compareNotif(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
