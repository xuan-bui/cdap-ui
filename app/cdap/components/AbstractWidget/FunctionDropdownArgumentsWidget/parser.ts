/*
 * Copyright © 2020 Cask Data, Inc.
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

export function parse(value) {
  const colonIndex = value.indexOf(':');
  // const [alias, fn] = value.split(':');
  const alias = value.substring(0, colonIndex);
  const fn = value.substring(colonIndex + 1);

  const defaultResponse = {
    alias,
    func: '',
    field: '',
    ignoreNulls: true,
    arguments: '',
  };

  if (!fn) {
    return defaultResponse;
  }

  const openBracketIndex = fn.indexOf('(');
  const closeBracketIndex = fn.indexOf(')');

  if (openBracketIndex === -1 || closeBracketIndex === -1) {
    return defaultResponse;
  }

  const params = fn.substring(openBracketIndex + 1, closeBracketIndex).split(',');
  const field = params[0];
  const ignoreNulls = params[params.length - 1] !== 'false';

  let args = '';
  if (params.length > 2) {
    args = decodeURIComponent(params.slice(1, params.length - 1).join(','));
  }

  return {
    alias,
    func: fn.substring(0, openBracketIndex),
    field,
    ignoreNulls,
    arguments: args,
  };
}

export function serialize(fields) {
  const { field, func, alias, arguments: args, ignoreNulls } = fields;

  if (field.length === 0 || func.length === 0 || alias.length === 0) {
    return '';
  }

  const trimmedArgs = args && args.trim();
  const argumentString =
    trimmedArgs && trimmedArgs.length > 0 ? `,${encodeURIComponent(trimmedArgs)}` : '';

  const updatedValue = `${alias}:${func}(${field}${argumentString},${!!ignoreNulls})`;
  return updatedValue;
}
