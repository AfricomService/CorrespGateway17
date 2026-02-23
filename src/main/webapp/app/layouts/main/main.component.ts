import { Component, OnInit, RendererFactory2, Renderer2 } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRouteSnapshot, NavigationEnd } from '@angular/router';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import dayjs from 'dayjs/esm';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { FindLanguageFromKeyPipe } from 'app/shared/language/find-language-from-key.pipe';

@Component({
  selector: 'jhi-main',
  templateUrl: './main.component.html',
})
export class MainComponent implements OnInit {
  private renderer: Renderer2;
  isHomePage = false;
  private account: Account | null = null;

  constructor(
    private accountService: AccountService,
    private titleService: Title,
    private router: Router,
    private findLanguageFromKeyPipe: FindLanguageFromKeyPipe,
    private translateService: TranslateService,
    rootRenderer: RendererFactory2
  ) {
    this.renderer = rootRenderer.createRenderer(document.querySelector('html'), null);
  }

  ngOnInit(): void {
    // try to log in automatically
    this.accountService.identity().subscribe();

    this.accountService.getAuthenticationState().subscribe(acc => {
      this.account = acc;
      this.updateTitle();
    });

    // Initialize isHomePage
    this.isHomePage = this.router.url === '/' || this.router.url.startsWith('/?');

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateTitle();
        this.isHomePage = this.router.url === '/' || this.router.url.startsWith('/?');
      }
    });

    this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
      this.updateTitle();
      dayjs.locale(langChangeEvent.lang);
      this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);

      this.updatePageDirection();
    });
  }

  private getPageTitle(routeSnapshot: ActivatedRouteSnapshot): string {
    const title: string = routeSnapshot.data['pageTitle'] ?? '';
    if (routeSnapshot.firstChild) {
      return this.getPageTitle(routeSnapshot.firstChild) || title;
    }
    return title;
  }

  private updateTitle(): void {
    const pageTitleKey = this.getPageTitle(this.router.routerState.snapshot.root) || 'global.title';

    if (pageTitleKey === 'home.title') {
      if (!this.account) {
        this.translateService.get('global.title').subscribe(title => this.titleService.setTitle(title));
      } else {
        const firstName = this.account.firstName || '';
        this.translateService.get('home.title', { firstName }).subscribe(title => this.titleService.setTitle(title));
      }
      return;
    }

    this.translateService.get(pageTitleKey).subscribe(title => this.titleService.setTitle(title));
  }

  private updatePageDirection(): void {
    this.renderer.setAttribute(
      document.querySelector('html'),
      'dir',
      this.findLanguageFromKeyPipe.isRTL(this.translateService.currentLang) ? 'rtl' : 'ltr'
    );
  }
}
