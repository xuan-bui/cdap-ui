// @ts-nocheck
/*
 * Copyright © 2015-2020 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import request from 'request';
import log4js from 'log4js';
import q from 'q';
import { extractConfig } from 'server/config/parser';

// router check also fetches the auth server address if security is enabled
export function ping() {
  return extractConfig('cdap').then(function(cdapConfig) {
    return new AuthAddress().doPing(cdapConfig);
  });
}

const log = log4js.getLogger('default');

const PING_INTERVAL = 1000,
  PING_MAX_RETRIES = 1000,
  PING_PATH = '/ping';

function AuthAddress() {
  this.enabled = false;
  this.addresses = [];
}

/**
 * Ping the backend to figure out if auth is enabled.
 * @return {Promise} resolved with Security instance.
 */
AuthAddress.prototype.doPing = function(cdapConfig) {
  var self = this,
    startTime,
    deferred = q.defer(),
    attempts = 0,
    url = cdapConfig['router.server.address'],
    checkTimeout = cdapConfig['dashboard.router.check.timeout.secs'],
    authMode = cdapConfig['security.authentication.mode'];

  if (cdapConfig['ssl.external.enabled'] === 'true') {
    url = 'https://' + url + ':' + cdapConfig['router.ssl.server.port'];
  } else {
    url = 'http://' + url + ':' + cdapConfig['router.server.port'];
  }
  url += PING_PATH;

  function pingAttempt() {
    attempts++;

    log.debug('Checking backend security endpoint ' + url + ' attempt ' + attempts);

    request(
      {
        method: 'GET',
        url: url,
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
      },
      function(err, response, body) {
        if (!err && (response && response.statusCode === 401)) {
          self.enabled = true;
          self.addresses = JSON.parse(body).auth_uri || [];
          log.info('Authentication mode: ' + authMode);
          log.info('Successfully connected to CDAP Router.');
          log.info('CDAP security is ' + (self.enabled ? 'enabled' : 'disabled') + '.');
          deferred.resolve(self);
        } else {
          if (err) {
            log.debug(err);
          }

          if (response && response.statusCode) {
            var logDebug = 'Status Code: ' + response.statusCode;

            if (body) {
              logDebug = logDebug + ', Body: ' + body;
            }

            log.debug(logDebug);
          }

          // if check timeout is enabled, and check takes longer than checkTimeout then exit
          if (checkTimeout > 0 && Math.round(Date.now() / 1000) - startTime > checkTimeout) {
            log.error(
              'Could not connect to CDAP Router using URL ' +
                url +
                ' for more than ' +
                checkTimeout +
                ' seconds. ' +
                'Please check if CDAP Router is configured correctly, and is up and running. ' +
                'Stopping CDAP UI due to this error.'
            );
            process.exit(1);
          }

          if (attempts == 1) {
            log.warn(
              'Unable to connect to CDAP Router. Will keep trying to connect in background. ' +
                (checkTimeout > 0
                  ? 'CDAP UI will exit in ' + checkTimeout + ' seconds if unable to connect.'
                  : '')
            );
          }

          setTimeout(pingAttempt, attempts < PING_MAX_RETRIES ? PING_INTERVAL : PING_INTERVAL * 60);
          deferred.resolve(self);
        }
      }
    );
  }

  log.info('Trying to connect to CDAP Router using URL ' + url);
  startTime = Math.round(Date.now() / 1000);
  pingAttempt();
  return deferred.promise;
};

/**
 * Picks an auth server address from options.
 * @return {String} Auth server address.
 */
AuthAddress.prototype.get = function() {
  if (!this.addresses.length) {
    return null;
  }
  return this.addresses[Math.floor(Math.random() * this.addresses.length)];
};
