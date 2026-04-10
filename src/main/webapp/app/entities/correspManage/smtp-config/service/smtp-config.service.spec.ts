import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ISmtpConfig } from '../smtp-config.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../smtp-config.test-samples';

import { SmtpConfigService } from './smtp-config.service';

const requireRestSample: ISmtpConfig = {
  ...sampleWithRequiredData,
};

describe('SmtpConfig Service', () => {
  let service: SmtpConfigService;
  let httpMock: HttpTestingController;
  let expectedResult: ISmtpConfig | ISmtpConfig[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(SmtpConfigService);
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

    it('should create a SmtpConfig', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const smtpConfig = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(smtpConfig).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a SmtpConfig', () => {
      const smtpConfig = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(smtpConfig).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a SmtpConfig', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of SmtpConfig', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a SmtpConfig', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addSmtpConfigToCollectionIfMissing', () => {
      it('should add a SmtpConfig to an empty array', () => {
        const smtpConfig: ISmtpConfig = sampleWithRequiredData;
        expectedResult = service.addSmtpConfigToCollectionIfMissing([], smtpConfig);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(smtpConfig);
      });

      it('should not add a SmtpConfig to an array that contains it', () => {
        const smtpConfig: ISmtpConfig = sampleWithRequiredData;
        const smtpConfigCollection: ISmtpConfig[] = [
          {
            ...smtpConfig,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addSmtpConfigToCollectionIfMissing(smtpConfigCollection, smtpConfig);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a SmtpConfig to an array that doesn't contain it", () => {
        const smtpConfig: ISmtpConfig = sampleWithRequiredData;
        const smtpConfigCollection: ISmtpConfig[] = [sampleWithPartialData];
        expectedResult = service.addSmtpConfigToCollectionIfMissing(smtpConfigCollection, smtpConfig);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(smtpConfig);
      });

      it('should add only unique SmtpConfig to an array', () => {
        const smtpConfigArray: ISmtpConfig[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const smtpConfigCollection: ISmtpConfig[] = [sampleWithRequiredData];
        expectedResult = service.addSmtpConfigToCollectionIfMissing(smtpConfigCollection, ...smtpConfigArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const smtpConfig: ISmtpConfig = sampleWithRequiredData;
        const smtpConfig2: ISmtpConfig = sampleWithPartialData;
        expectedResult = service.addSmtpConfigToCollectionIfMissing([], smtpConfig, smtpConfig2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(smtpConfig);
        expect(expectedResult).toContain(smtpConfig2);
      });

      it('should accept null and undefined values', () => {
        const smtpConfig: ISmtpConfig = sampleWithRequiredData;
        expectedResult = service.addSmtpConfigToCollectionIfMissing([], null, smtpConfig, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(smtpConfig);
      });

      it('should return initial array if no SmtpConfig is added', () => {
        const smtpConfigCollection: ISmtpConfig[] = [sampleWithRequiredData];
        expectedResult = service.addSmtpConfigToCollectionIfMissing(smtpConfigCollection, undefined, null);
        expect(expectedResult).toEqual(smtpConfigCollection);
      });
    });

    describe('compareSmtpConfig', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareSmtpConfig(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareSmtpConfig(entity1, entity2);
        const compareResult2 = service.compareSmtpConfig(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareSmtpConfig(entity1, entity2);
        const compareResult2 = service.compareSmtpConfig(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareSmtpConfig(entity1, entity2);
        const compareResult2 = service.compareSmtpConfig(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
