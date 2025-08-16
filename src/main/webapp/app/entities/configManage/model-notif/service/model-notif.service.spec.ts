import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IModelNotif } from '../model-notif.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../model-notif.test-samples';

import { ModelNotifService, RestModelNotif } from './model-notif.service';

const requireRestSample: RestModelNotif = {
  ...sampleWithRequiredData,
  createdDate: sampleWithRequiredData.createdDate?.toJSON(),
};

describe('ModelNotif Service', () => {
  let service: ModelNotifService;
  let httpMock: HttpTestingController;
  let expectedResult: IModelNotif | IModelNotif[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(ModelNotifService);
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

    it('should create a ModelNotif', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const modelNotif = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(modelNotif).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a ModelNotif', () => {
      const modelNotif = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(modelNotif).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a ModelNotif', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of ModelNotif', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a ModelNotif', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addModelNotifToCollectionIfMissing', () => {
      it('should add a ModelNotif to an empty array', () => {
        const modelNotif: IModelNotif = sampleWithRequiredData;
        expectedResult = service.addModelNotifToCollectionIfMissing([], modelNotif);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(modelNotif);
      });

      it('should not add a ModelNotif to an array that contains it', () => {
        const modelNotif: IModelNotif = sampleWithRequiredData;
        const modelNotifCollection: IModelNotif[] = [
          {
            ...modelNotif,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addModelNotifToCollectionIfMissing(modelNotifCollection, modelNotif);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a ModelNotif to an array that doesn't contain it", () => {
        const modelNotif: IModelNotif = sampleWithRequiredData;
        const modelNotifCollection: IModelNotif[] = [sampleWithPartialData];
        expectedResult = service.addModelNotifToCollectionIfMissing(modelNotifCollection, modelNotif);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(modelNotif);
      });

      it('should add only unique ModelNotif to an array', () => {
        const modelNotifArray: IModelNotif[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const modelNotifCollection: IModelNotif[] = [sampleWithRequiredData];
        expectedResult = service.addModelNotifToCollectionIfMissing(modelNotifCollection, ...modelNotifArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const modelNotif: IModelNotif = sampleWithRequiredData;
        const modelNotif2: IModelNotif = sampleWithPartialData;
        expectedResult = service.addModelNotifToCollectionIfMissing([], modelNotif, modelNotif2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(modelNotif);
        expect(expectedResult).toContain(modelNotif2);
      });

      it('should accept null and undefined values', () => {
        const modelNotif: IModelNotif = sampleWithRequiredData;
        expectedResult = service.addModelNotifToCollectionIfMissing([], null, modelNotif, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(modelNotif);
      });

      it('should return initial array if no ModelNotif is added', () => {
        const modelNotifCollection: IModelNotif[] = [sampleWithRequiredData];
        expectedResult = service.addModelNotifToCollectionIfMissing(modelNotifCollection, undefined, null);
        expect(expectedResult).toEqual(modelNotifCollection);
      });
    });

    describe('compareModelNotif', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareModelNotif(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = null;

        const compareResult1 = service.compareModelNotif(entity1, entity2);
        const compareResult2 = service.compareModelNotif(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

        const compareResult1 = service.compareModelNotif(entity1, entity2);
        const compareResult2 = service.compareModelNotif(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };

        const compareResult1 = service.compareModelNotif(entity1, entity2);
        const compareResult2 = service.compareModelNotif(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
