import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { CustomSearchDetailComponent } from './custom-search-detail.component';

describe('CustomSearch Management Detail Component', () => {
  let comp: CustomSearchDetailComponent;
  let fixture: ComponentFixture<CustomSearchDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomSearchDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ customSearch: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(CustomSearchDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(CustomSearchDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load customSearch on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.customSearch).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
