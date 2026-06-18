import { Component, OnInit, Compiler, Injector, NgModuleFactory, Type, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SessionStorageService } from 'ngx-webstorage';

import { VERSION } from 'app/app.constants';
import { LANGUAGES } from 'app/config/language.constants';
import { Account } from 'app/core/auth/account.model';
import { AccountService } from 'app/core/auth/account.service';
import { LoginService } from 'app/login/login.service';
import { ProfileService } from 'app/layouts/profiles/profile.service';
import { EntityNavbarItems } from 'app/entities/entity-navbar-items';
import { CorrespService } from 'app/entities/correspManage/corresp/service/corresp.service';

@Component({
  selector: 'jhi-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NavbarComponent implements OnInit {
  inProduction?: boolean;
  isNavbarCollapsed = true;
  languages = LANGUAGES;
  openAPIEnabled?: boolean;
  version = '';
  account: Account | null = null;
  entitiesNavbarItems: any[] = [];

  canCreateArrivee = false;

  constructor(
    private loginService: LoginService,
    private translateService: TranslateService,
    private sessionStorageService: SessionStorageService,
    private compiler: Compiler,
    private injector: Injector,
    private accountService: AccountService,
    private profileService: ProfileService,
    private router: Router,
    private correspService: CorrespService
  ) {
    if (VERSION) {
      this.version = VERSION.toLowerCase().startsWith('v') ? VERSION : `v${VERSION}`;
    }
  }

  ngOnInit(): void {
    this.entitiesNavbarItems = EntityNavbarItems;
    this.profileService.getProfileInfo().subscribe(profileInfo => {
      this.inProduction = profileInfo.inProduction;
      this.openAPIEnabled = profileInfo.openAPIEnabled;
    });

    this.accountService.getAuthenticationState().subscribe(account => {
      this.account = account;
      this.canCreateArrivee =
        account != null &&
        account.authorities != null &&
        (account.authorities.includes('ROLE_BOC') || account.authorities.includes('ROLE_ADMIN'));
    });
  }

  changeLanguage(languageKey: string): void {
    this.sessionStorageService.store('locale', languageKey);
    this.translateService.use(languageKey);
  }

  collapseNavbar(): void {
    this.isNavbarCollapsed = true;
  }

  login(): void {
    // this.router.navigate(['/login']);
    this.loginService.login();
  }

  logout(): void {
    this.collapseNavbar();
    this.loginService.logout();
    this.router.navigate(['']);
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }

  // === Société modal state ===
  societeModalOpen = false;
  societeModalType = '';
  societeModalList: { id: number; raisonSociale: string; codeSociete?: string | null }[] = [];
  societeModalSelected: { id: number; raisonSociale: string; codeSociete?: string | null } | null = null;

  navigateTo(type: string): void {
    this.collapseNavbar();
    if (type === 'Sortant') {
      this.router.navigate(['/corresp/new-out']);
      return;
    }
    this.correspService.getMySocietes().subscribe({
      next: societes => {
        if (societes.length <= 1) {
          const queryParams: any = { type };
          if (societes.length === 1) {
            queryParams['societeId'] = societes[0].id;
            queryParams['societeCode'] = societes[0].codeSociete ?? '';
          }
          this.router.navigate(['/corresp/new'], { queryParams });
        } else {
          this.societeModalList = societes;
          this.societeModalType = type;
          this.societeModalSelected = null;
          this.societeModalOpen = true;
        }
      },
      error: () => {
        this.router.navigate(['/corresp/new'], { queryParams: { type } });
      },
    });
  }

  closeSocieteModal(): void {
    this.societeModalOpen = false;
    this.societeModalList = [];
    this.societeModalSelected = null;
  }

  confirmSocieteModalSelection(): void {
    if (!this.societeModalSelected) return;
    this.router.navigate(['/corresp/new'], {
      queryParams: {
        type: this.societeModalType,
        societeId: this.societeModalSelected.id,
        societeCode: this.societeModalSelected.codeSociete ?? '',
      },
    });
    this.closeSocieteModal();
  }

  private loadModule(moduleType: Type<any>): void {
    const moduleFactory = this.compiler.compileModuleAndAllComponentsSync(moduleType);
    moduleFactory.ngModuleFactory.create(this.injector);
  }
}
