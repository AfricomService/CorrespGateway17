import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { CustomSearchFormService } from './custom-search-form.service';
import { CustomSearchService } from '../service/custom-search.service';
import { ICustomSearch } from '../custom-search.model';

import { CustomSearchUpdateComponent } from './custom-search-update.component';

describe('CustomSearch Management Update Component', () => {
  let comp: CustomSearchUpdateComponent;
  let fixture: ComponentFixture<CustomSearchUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let customSearchFormService: CustomSearchFormService;
  let customSearchService: CustomSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [CustomSearchUpdateComponent],
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
      .overrideTemplate(CustomSearchUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(CustomSearchUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    customSearchFormService = TestBed.inject(CustomSearchFormService);
    customSearchService = TestBed.inject(CustomSearchService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const customSearch: ICustomSearch = { id: 456 };

      activatedRoute.data = of({ customSearch });
      comp.ngOnInit();

      expect(comp.customSearch).toEqual(customSearch);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICustomSearch>>();
      const customSearch = { id: 123 };
      jest.spyOn(customSearchFormService, 'getCustomSearch').mockReturnValue(customSearch);
      jest.spyOn(customSearchService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ customSearch });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: customSearch }));
      saveSubject.complete();

      // THEN
      expect(customSearchFormService.getCustomSearch).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(customSearchService.update).toHaveBeenCalledWith(expect.objectContaining(customSearch));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICustomSearch>>();
      const customSearch = { id: 123 };
      jest.spyOn(customSearchFormService, 'getCustomSearch').mockReturnValue({ id: null });
      jest.spyOn(customSearchService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ customSearch: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: customSearch }));
      saveSubject.complete();

      // THEN
      expect(customSearchFormService.getCustomSearch).toHaveBeenCalled();
      expect(customSearchService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICustomSearch>>();
      const customSearch = { id: 123 };
      jest.spyOn(customSearchService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ customSearch });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(customSearchService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
