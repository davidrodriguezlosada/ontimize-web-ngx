import { Injector } from '@angular/core';
import { BaseRequestOptions, XHRBackend } from '@angular/http';
import { MdIconRegistry } from '@angular/material';

import {
  LoginService,
  NavigationService,
  OntimizeService,
  MomentService,
  NumberService,
  CurrencyService,
  OTranslateService,
  DialogService,
  AuthGuardService,
  authGuardServiceFactory,
  dataServiceFactory,
  LocalStorageService,
  appConfigFactory,
  serviceConfigFactory
} from '../services';

import { Events } from '../util/events';
import { OHttp } from '../util/http/OHttp';
import {
  AppConfig,
  ServiceConfig
} from '../config/app-config';

/**
 * Bind some global events and publish on the 'app' channel
 */
export function bindEvents(window, document) {
  const events = new Events();
  function publishEventWrapper(channel): Function {
    return function (ev) {
      events.publish(channel, ev);
    };
  }
  window.addEventListener('online', publishEventWrapper('app:online'), false);
  window.addEventListener('offline', publishEventWrapper('app:offline'), false);
  window.addEventListener('orientationchange', publishEventWrapper('app:rotated'));
  // When that status taps, we respond
  window.addEventListener('statusTap', publishEventWrapper('app:statusTap'));
  // start listening for resizes XXms after the app starts
  setTimeout(function () {
    window.addEventListener('resize', publishEventWrapper('app:resize'));
  }, 2000);
  return events;
}

export function getEvents() {
  return bindEvents(window, document);
}


export function getOntimizeServiceProvider(backend, defaultOptions) {
  return new OHttp(backend, defaultOptions);
}

export function getLoginServiceProvider(injector) {
  return new LoginService(injector);
}

export function getNavigationServiceProvider(injector) {
  return new NavigationService(injector);
}

export function getMomentServiceProvider(injector) {
  return new MomentService(injector);
}

export function getCurrencyServiceProvider(injector) {
  return new CurrencyService(injector);
}

export function getNumberServiceProvider(injector) {
  return new NumberService(injector);
}

export function getDialogServiceProvider(injector) {
  return new DialogService(injector);
}

export function getTranslateServiceProvider(injector) {
  return new OTranslateService(injector);
}

export function getLocalStorageServiceProvider(injector) {
  return new LocalStorageService(injector);
}

export const ONTIMIZE_PROVIDERS = [
  //Standard
  MdIconRegistry,

  { provide: Events, useValue: getEvents },

  {
    provide: AppConfig,
    useFactory: appConfigFactory,
    deps: [Injector]
  },

  {
    provide: ServiceConfig,
    useFactory: serviceConfigFactory,
    deps: [Injector]
  },

  // getOntimizeServiceProvider
  XHRBackend,
  BaseRequestOptions,
  {
    provide: OHttp,
    useFactory: getOntimizeServiceProvider,
    deps: [XHRBackend, BaseRequestOptions]
  },
  {
    provide: OntimizeService,
    useFactory: dataServiceFactory,
    deps: [Injector]
  },
  // getLoginServiceProvider
  {
    provide: LoginService,
    useFactory: getLoginServiceProvider,
    deps: [Injector]
  },
  //getNavigationServiceProvider
  {
    provide: NavigationService,
    useFactory: getNavigationServiceProvider,
    deps: [Injector]
  },
  // getMomentServiceProvider
  {
    provide: MomentService,
    useFactory: getMomentServiceProvider,
    deps: [Injector]
  },
  // getCurrencyServiceProvider
  {
    provide: CurrencyService,
    useFactory: getCurrencyServiceProvider,
    deps: [Injector]
  },
  //getNumberServiceProvider
  {
    provide: NumberService,
    useFactory: getNumberServiceProvider,
    deps: [Injector]
  },
  // getDialogServiceProvider
  {
    provide: DialogService,
    useFactory: getDialogServiceProvider,
    deps: [Injector]
  },
  // getTranslateServiceProvider
  {
    provide: OTranslateService,
    useFactory: getTranslateServiceProvider,
    deps: [Injector]
  },
  // getLocalStorageServiceProvider
  {
    provide: LocalStorageService,
    useFactory: getLocalStorageServiceProvider,
    deps: [Injector]
  },
  // getAuthServiceProvider
  {
    provide: AuthGuardService,
    useFactory: authGuardServiceFactory,
    deps: [Injector]
  }
];
