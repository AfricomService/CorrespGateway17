// src/main/webapp/app/app.module.ts
import { NgModule, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import locale from '@angular/common/locales/fr';
import { BrowserModule, Title } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxWebstorageModule } from 'ngx-webstorage';
import dayjs from 'dayjs/esm';
import { NgbDateAdapter, NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import './config/dayjs';
import { SharedModule } from 'app/shared/shared.module';
import { TranslationModule } from 'app/shared/language/translation.module';
import { AppRoutingModule } from './app-routing.module';
import { HomeModule } from './home/home.module';
// jhipster-needle-angular-add-module-import JHipster will add new module here
import { NgbDateDayjsAdapter } from './config/datepicker-adapter';
import { fontAwesomeIcons } from './config/font-awesome-icons';
import { httpInterceptorProviders } from 'app/core/interceptor/index';
import { FindLanguageFromKeyPipe } from 'app/shared/language/find-language-from-key.pipe';
import { MainComponent } from './layouts/main/main.component';
import { NavbarComponent } from './layouts/navbar/navbar.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { PageRibbonComponent } from './layouts/profiles/page-ribbon.component';
import { ActiveMenuDirective } from './layouts/navbar/active-menu.directive';
import { ErrorComponent } from './layouts/error/error.component';

declare const SERVER_API_URL: string;

/**
 * Import explicite des icônes utilisées dans ton template.
 * Ajouté : faFileExcel, faPowerOff, faSearch
 */
import {
  faMapMarkerAlt,
  faPhone,
  faFax,
  faEnvelope,
  faGlobe,
  faPlus,
  faEye,
  faPencilAlt,
  faTrash,
  faChevronDown,
  faChevronUp,
  faBuilding,
  faArrowLeft,
  faSave,
  faBan,
  faFileExcel,
  faPowerOff,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';

@NgModule({
  imports: [
    BrowserModule,
    SharedModule,
    HomeModule,
    // jhipster-needle-angular-add-module JHipster will add new module here
    AppRoutingModule,
    // Set this to true to enable service worker (PWA)
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: false }),
    HttpClientModule,
    NgxWebstorageModule.forRoot({ prefix: 'jhi', separator: '-', caseSensitive: true }),
    TranslationModule,
    FontAwesomeModule, // <-- nécessaire pour <fa-icon>
  ],
  providers: [
    Title,
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: NgbDateAdapter, useClass: NgbDateDayjsAdapter },
    FindLanguageFromKeyPipe,
    httpInterceptorProviders,
  ],
  declarations: [MainComponent, NavbarComponent, ErrorComponent, PageRibbonComponent, ActiveMenuDirective, FooterComponent],
  bootstrap: [MainComponent],
})
export class AppModule {
  constructor(applicationConfigService: ApplicationConfigService, iconLibrary: FaIconLibrary, dpConfig: NgbDatepickerConfig) {
    applicationConfigService.setEndpointPrefix(SERVER_API_URL);
    registerLocaleData(locale);

    // Ajoute ton tableau d'icônes existant + icônes manquantes utilisées dans les templates
    iconLibrary.addIcons(
      ...fontAwesomeIcons,
      faMapMarkerAlt,
      faPhone,
      faFax,
      faEnvelope,
      faGlobe,
      faPlus,
      faEye,
      faPencilAlt,
      faTrash,
      faChevronDown,
      faChevronUp,
      faBuilding,
      faArrowLeft,
      faSave,
      faBan,
      faFileExcel,
      faPowerOff,
      faSearch
    );

    dpConfig.minDate = { year: dayjs().subtract(100, 'year').year(), month: 1, day: 1 };
  }
}
