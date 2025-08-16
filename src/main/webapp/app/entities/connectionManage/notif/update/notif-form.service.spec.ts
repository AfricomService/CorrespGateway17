import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../notif.test-samples';

import { NotifFormService } from './notif-form.service';

describe('Notif Form Service', () => {
  let service: NotifFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotifFormService);
  });

  describe('Service methods', () => {
    describe('createNotifFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createNotifFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            title: expect.any(Object),
            body: expect.any(Object),
            recipientEmail: expect.any(Object),
            recipeientccemail: expect.any(Object),
            receipientbccemail: expect.any(Object),
            senderEmail: expect.any(Object),
            sentDate: expect.any(Object),
            status: expect.any(Object),
            typeNotif: expect.any(Object),
            messageID: expect.any(Object),
          })
        );
      });

      it('passing INotif should create a new form with FormGroup', () => {
        const formGroup = service.createNotifFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            title: expect.any(Object),
            body: expect.any(Object),
            recipientEmail: expect.any(Object),
            recipeientccemail: expect.any(Object),
            receipientbccemail: expect.any(Object),
            senderEmail: expect.any(Object),
            sentDate: expect.any(Object),
            status: expect.any(Object),
            typeNotif: expect.any(Object),
            messageID: expect.any(Object),
          })
        );
      });
    });

    describe('getNotif', () => {
      it('should return NewNotif for default Notif initial value', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formGroup = service.createNotifFormGroup(sampleWithNewData);

        const notif = service.getNotif(formGroup) as any;

        expect(notif).toMatchObject(sampleWithNewData);
      });

      it('should return NewNotif for empty Notif initial value', () => {
        const formGroup = service.createNotifFormGroup();

        const notif = service.getNotif(formGroup) as any;

        expect(notif).toMatchObject({});
      });

      it('should return INotif', () => {
        const formGroup = service.createNotifFormGroup(sampleWithRequiredData);

        const notif = service.getNotif(formGroup) as any;

        expect(notif).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing INotif should not enable id FormControl', () => {
        const formGroup = service.createNotifFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewNotif should disable id FormControl', () => {
        const formGroup = service.createNotifFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
