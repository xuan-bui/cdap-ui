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

import * as React from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import withStyles from '@material-ui/core/styles/withStyles';
import { IconWrapper } from 'components/AbstractWidget/SchemaEditor/RowButtons/IconWrapper';
const styles = (theme) => {
  return {
    root: {
      color: theme.palette.red[100],
    },
  };
};

function RemoveRowButtonBase({ classes, onRemove, ...rest }) {
  return (
    <IconWrapper
      onClick={onRemove}
      data-cy="schema-field-remove-button"
      data-testid="schema-field-remove-button"
      disabled={typeof onRemove !== 'function'}
    >
      <DeleteIcon
        className={typeof onRemove === 'function' ? classes.root : ''}
        color={typeof onRemove !== 'function' ? 'disabled' : 'action'}
      />
    </IconWrapper>
  );
}
const RemoveRowButton = withStyles(styles)(RemoveRowButtonBase);
export { RemoveRowButton };
