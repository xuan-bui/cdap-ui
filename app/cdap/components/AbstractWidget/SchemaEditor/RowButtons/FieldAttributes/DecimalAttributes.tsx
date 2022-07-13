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
import WidgetWrapper from 'components/shared/ConfigurationGroup/WidgetWrapper';
import Button from '@material-ui/core/Button';
import {
  defaultPrecision,
  defaultScale,
} from 'components/AbstractWidget/SchemaEditor/SchemaConstants';
import { IAttributesComponentProps } from 'components/AbstractWidget/SchemaEditor/EditorTypes';
import { objectQuery } from 'services/helpers';
import { useAttributePopoverStyles } from 'components/AbstractWidget/SchemaEditor/RowButtons/FieldAttributes/FieldAttributesPopoverButton';
import If from 'components/shared/If';

function DecimalTypeAttributes({
  typeProperties,
  onChange,
  handleClose,
}: IAttributesComponentProps) {
  let derivedScale = objectQuery(typeProperties, 'scale');
  let derivedPrecision = objectQuery(typeProperties, 'precision');
  derivedScale = typeof derivedScale === 'number' ? derivedScale : defaultScale;
  derivedPrecision = typeof derivedPrecision === 'number' ? derivedPrecision : defaultPrecision;
  const [scale, setScale] = React.useState(derivedScale);
  const [precision, setPrecision] = React.useState(derivedPrecision);
  const classes = useAttributePopoverStyles();

  const onChangeHandler = () => {
    onChange('typeProperties', {
      scale: parseInt(scale, 10),
      precision: parseInt(precision, 10),
    });
    handleClose();
  };
  return (
    <React.Fragment>
      <div className={classes.root}>
        <WidgetWrapper
          pluginProperty={{
            name: 'scale',
            macroSupported: false,
            description: 'Scale of decimal',
          }}
          widgetProperty={{
            'widget-type': 'number',
            label: 'Scale',
          }}
          value={scale}
          onChange={setScale}
        />
        <WidgetWrapper
          pluginProperty={{
            name: 'Precision',
            macroSupported: false,
            description: 'Precision of decimal',
          }}
          widgetProperty={{
            'widget-type': 'number',
            label: 'Precision',
          }}
          value={precision}
          onChange={setPrecision}
        />
      </div>
      <If condition={typeof onChange === 'function'}>
        <Button variant="contained" color="primary" onClick={onChangeHandler}>
          Save
        </Button>
      </If>
    </React.Fragment>
  );
}

export { DecimalTypeAttributes };
