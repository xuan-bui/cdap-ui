/*
 * Copyright © 2017 Cask Data, Inc.
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

import { execute } from 'components/HttpExecutor/store/HttpExecutorActionCreator';
import T from 'i18n-react';
import React from 'react';

const PREFIX = 'features.HttpExecutor';

export default function SendButton() {
  return (
    <div className="send-button-container text-right">
      <button className="btn btn-primary" onClick={execute} data-cy="send-btn">
        {T.translate(`${PREFIX}.send`)}
      </button>
    </div>
  );
}
