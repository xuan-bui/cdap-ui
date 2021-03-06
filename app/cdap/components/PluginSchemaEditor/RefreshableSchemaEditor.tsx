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
import { SchemaEditor } from 'components/AbstractWidget/SchemaEditor';
import If from 'components/shared/If';
import LoadingSVG from 'components/shared/LoadingSVG';
import withStyles, { WithStyles, StyleRules } from '@material-ui/core/styles/withStyles';
import { ISchemaType } from 'components/AbstractWidget/SchemaEditor/SchemaTypes';

const styles = (): StyleRules => {
  return {
    container: {
      textAlign: 'center',
    },
  };
};

interface IPluginSchema {
  name: string;
  schema: string;
}

interface IRefreshableSchemaEditor extends WithStyles<typeof styles> {
  schema: ISchemaType;
  onChange: (props: { avroSchema: ISchemaType }) => void;
  disabled?: boolean;
  visibleRows?: number;
  errors?: Record<string, string>;
}

function RefreshableSchemaEditorBase({
  schema,
  onChange,
  disabled,
  classes,
  visibleRows,
  errors,
}: IRefreshableSchemaEditor) {
  const [loading, setLoading] = React.useState(false);
  const [isSchemaUpdateInProgress, setIsSchemaUpdateInProgress] = React.useState(0);

  React.useEffect(() => {
    if (isSchemaUpdateInProgress > 0) {
      return setIsSchemaUpdateInProgress(isSchemaUpdateInProgress - 1);
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [schema]);

  return (
    <div className={classes.container}>
      <If condition={loading}>
        <LoadingSVG />
      </If>
      <If condition={!loading}>
        <SchemaEditor
          schema={schema}
          disabled={disabled}
          onChange={(...props) => {
            setIsSchemaUpdateInProgress((prevState) => prevState + 1);
            onChange.apply(null, props);
          }}
          visibleRows={visibleRows}
          errors={errors}
        />
      </If>
    </div>
  );
}
const RefreshableSchemaEditor = withStyles(styles)(RefreshableSchemaEditorBase);
export { RefreshableSchemaEditor };
