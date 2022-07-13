/*
 * Copyright © 2019 Cask Data, Inc.
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
import Select, { SelectProps } from '@material-ui/core/Select';
import { IWidgetProps } from 'components/AbstractWidget';
import Input from '@material-ui/core/Input';
import InputBase from '@material-ui/core/InputBase';
import MenuItem from '@material-ui/core/MenuItem';
import React, { useEffect, useState } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { WIDGET_PROPTYPES } from 'components/AbstractWidget/constants';
import { isNilOrEmptyString } from 'services/helpers';
import { objectQuery } from 'services/helpers';
import withStyles from '@material-ui/core/styles/withStyles';

const CustomTooltip = withStyles((theme) => {
  return {
    tooltip: {
      backgroundColor: theme.palette.grey[200],
      color: (theme.palette as any).white[50],
      fontSize: '12px',
      wordBreak: 'break-word',
    },
  };
})(Tooltip);

const CustomizedInputBase = withStyles((theme) => {
  return {
    input: {
      padding: '7px 18px 7px 12px',
      '&:focus': {
        backgroundColor: 'transparent',
        outline: `1px solid ${(theme.palette as any).blue[100]}`,
      },
    },
  };
})(InputBase);

const CustomizedInput = withStyles((theme) => {
  return {
    input: {
      padding: '7px 18px 7px 12px',
      '&:focus': {
        backgroundColor: 'transparent',
        outline: `1px solid ${(theme.palette as any).blue[100]}`,
      },
    },
  };
})(Input);

const DenseMenuItem = withStyles(() => {
  return {
    root: {
      minHeight: 'unset',
      paddingTop: '3px',
      paddingBottom: '3px',
    },
  };
})(MenuItem);

const InlineSelect = withStyles(() => {
  return {
    root: {
      display: 'inline-block',
    },
  };
})(Select);

interface ISelectWidgetProps extends SelectProps {
  dense?: boolean;
  inline?: boolean;
  native?: boolean;
  default?: string;
  enableUnderline?: boolean;
  type?: string;
}

interface ISelectProps extends IWidgetProps<ISelectWidgetProps> {
  placeholder?: string;
  inputRef?: (ref: React.ReactNode) => void;
  classes?: any;
}

const GraphPropertyWidget: React.FC<ISelectProps> = ({
  value,
  onChange,
  widgetProps,
  disabled,
  dataCy,
  dataTestId,
  inputRef,
  placeholder,
  classes,
  ...restProps
}: ISelectProps) => {
  const [vertexOptions, setVertexOptions] = useState([]);
  const [edgeOptions, setEdgeOptions] = useState([]);

  useEffect(() => {
    fetchListAttributes();
  });

  const onChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const v = event.target.value;
    if (typeof onChange === 'function') {
      onChange(v);
    }
  };

  function fetchListAttributes() {
    fetch('https://1216c360-c289-4d5d-a037-cd93adfb492c.mock.pstmn.io/')
      .then((response) => response.json())
      .then((data) => {
        setVertexOptions(
          data.vertexlabels.map((i) => ({
            label: i.name,
            value: i.name,
          }))
        );
        setEdgeOptions(
          data.edgelabels.map((i) => ({
            label: i.name,
            value: i.name,
          }))
        );
      });
  }

  // TODO: load list vertex or edge from API or plugin function
  // const vertexOptions: any[] = [
  //   {
  //     label: 'Customer',
  //     value: 'customers',
  //   },
  //   {
  //     label: 'Order',
  //     value: 'orders',
  //   },
  //   {
  //     label: 'Product',
  //     value: 'products',
  //   },
  // ];
  // const edgeOptions: any[] = [
  //   {
  //     label: 'Buy',
  //     value: 'buy',
  //   },
  //   { label: 'Like', value: 'like' },
  // ];

  const type = objectQuery(widgetProps, 'type') || 'vertex';
  const dense = objectQuery(widgetProps, 'dense') || false;
  const inline = objectQuery(widgetProps, 'inline') || false;
  const native = objectQuery(widgetProps, 'native') || false;
  const MenuProps = objectQuery(widgetProps, 'MenuProps') || {};
  const enableUnderline = objectQuery(widgetProps, 'enableUnderline') || false;
  const OptionItem = native ? 'option' : dense ? DenseMenuItem : MenuItem;
  const SelectComponent = inline ? InlineSelect : Select;
  let optionValues = type === 'vertex' ? vertexOptions : edgeOptions;
  if (!isNilOrEmptyString(placeholder)) {
    optionValues = [{ placeholder, value: '', label: placeholder }, ...optionValues];
  }

  const InputComponent = enableUnderline ? CustomizedInput : CustomizedInputBase;

  return (
    <SelectComponent
      fullWidth
      value={value}
      onChange={onChangeHandler}
      input={<InputComponent />}
      readOnly={disabled}
      inputProps={{
        'data-cy': dataCy,
        'data-testid': dataTestId,
      }}
      MenuProps={{
        getContentAnchorEl: null,
        style: {
          zIndex: 1302,
        },
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
        ...MenuProps,
      }}
      displayEmpty={!isNilOrEmptyString(placeholder)}
      inputRef={inputRef}
      classes={classes}
      data-cy={`select-${dataCy}`}
      data-testid={`select-${dataTestId}`}
      {...widgetProps}
    >
      {optionValues.map((opt) => {
        const option = (
          <OptionItem
            value={opt.value}
            key={opt.value}
            disabled={opt.disabled || !isNilOrEmptyString(opt.placeholder)}
            data-cy={`option-${opt.value}`}
          >
            {opt.label}
          </OptionItem>
        );
        return option;
      })}
    </SelectComponent>
  );
};

(GraphPropertyWidget as any).propTypes = WIDGET_PROPTYPES;
(GraphPropertyWidget as any).getWidgetAttributes = () => {
  return {
    default: { type: 'string', required: false },
    dense: { type: 'boolean', required: false },
    inline: { type: 'boolean', required: false },
    native: { type: 'boolean', required: false },
  };
};

export default GraphPropertyWidget;
