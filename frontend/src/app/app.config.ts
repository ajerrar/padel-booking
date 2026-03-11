import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Methode provideBrowserGlobalErrorListeners: gere provide browser global error listeners de ce bloc.
    provideBrowserGlobalErrorListeners(),
    // Methode provideRouter: gere provide router de ce bloc.
    provideRouter(routes)
  ]
};
