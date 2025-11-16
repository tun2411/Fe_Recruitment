// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // Sử dụng relative path khi dùng proxy, hoặc full URL khi không dùng proxy
  apiUrl: '/api', // Proxy sẽ forward đến http://localhost:8080/api
  // Nếu không dùng proxy, uncomment dòng dưới:
  // apiUrl: 'http://localhost:8080/api',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
