import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { NotifFormService } from './notif-form.service';
import { NotifService } from '../service/notif.service';
import { INotif } from '../notif.model';

import { NotifUpdateComponent } from './notif-update.component';

describe('Notif Management Update Component', () => {
  let comp: NotifUpdateComponent;
  let fixture: ComponentFixture<NotifUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let notifFormService: NotifFormService;
  let notifService: NotifService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [NotifUpdateComponent],
      providers: [
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(NotifUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(NotifUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    notifFormService = TestBed.inject(NotifFormService);
    notifService = TestBed.inject(NotifService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const notif: INotif = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

      activatedRoute.data = of({ notif });
      comp.ngOnInit();

      expect(comp.notif).toEqual(notif);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INotif>>();
      const notif = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(notifFormService, 'getNotif').mockReturnValue(notif);
      jest.spyOn(notifService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ notif });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: notif }));
      saveSubject.complete();

      // THEN
      expect(notifFormService.getNotif).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(notifService.update).toHaveBeenCalledWith(expect.objectContaining(notif));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INotif>>();
      const notif = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(notifFormService, 'getNotif').mockReturnValue({ id: null });
      jest.spyOn(notifService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ notif: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: notif }));
      saveSubject.complete();

      // THEN
      expect(notifFormService.getNotif).toHaveBeenCalled();
      expect(notifService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INotif>>();
      const notif = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(notifService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ notif });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(notifService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
