/*
 * Copyright © 2016 Cask Data, Inc.
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

import PropTypes from 'prop-types';

import React from 'react';
var classnames = require('classnames');

require('./Tabs.scss');

export default function Tabs({ layout, children, className }) {
  return <div className={classnames('cask-tabs', layout, className)}>{children}</div>;
}
Tabs.propTypes = {
  layout: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
