import * as React from 'react';

import AbstractMultiRowWidget, {
  IMultiRowProps,
  IMultiRowWidgetProps,
} from 'components/AbstractWidget/AbstractMultiRowWidget';

import ThemeWrapper from 'components/ThemeWrapper';
import { objectQuery } from 'services/helpers';
import DataMappingRow, { IDropdownOption } from './DataMappingRow';
import uuidV4 from 'uuid/v4';

interface IDataMappingWidgetProps extends IMultiRowWidgetProps {
  'key-placeholder'?: string;
  'kv-delimiter'?: string;
  'kv-pair-limit'?: number;
  inputDropdownOptions: IDropdownOption[];
  outputDropdownOptions: IDropdownOption[];
  delimiter?: string;
  showDelimiter?: boolean;
  hasOutput?: boolean;
}

interface IDataMappingProps extends IMultiRowProps<IDataMappingWidgetProps> {
  inputDropdownOptions: IDropdownOption[];
  outputDropdownOptions: IDropdownOption[];
  hasOutput?: boolean;
}

class DataMappingWidgetView extends AbstractMultiRowWidget<IDataMappingProps> {
  public deconstructValues = (props) => {
    if (!props.value || props.value.length === 0) {
      return [];
    }
    // const delimiter = objectQuery(props, 'widgetProps', 'delimiter') || ',';

    return props.value;
  };

  public constructValues = (): any => {
    const values = this.state.rows
      .filter((id) => this.values[id])
      .map((id) => this.values[id].value);

    return values;
  };

  public addRow = (index = -1, shouldFocus: boolean = true) => {
    const rows = this.state.rows.slice();
    const id = uuidV4();
    rows.splice(index + 1, 0, id);

    this.values[id] = {
      ref: React.createRef(),
      value: {
        key: '',
        value: '',
      },
    };

    this.setState(
      {
        rows,
        autofocus: shouldFocus ? id : null,
      },
      () => {
        if (shouldFocus) {
          this.onChange();
        }
      }
    );
  };

  public renderRow = (id, index) => {
    const keyPlaceholder = objectQuery(this.props, 'widgetProps', 'key-placeholder');
    const kvDelimiter = objectQuery(this.props, 'widgetProps', 'kv-delimiter');
    const rowLimit = objectQuery(this.props, 'widgetProps', 'kv-pair-limit');
    const addRowDisabled = !!rowLimit && Object.keys(this.values).length >= rowLimit;

    return (
      <DataMappingRow
        key={id}
        value={this.values[id].value}
        id={id}
        index={index}
        onChange={this.editRow}
        addRow={this.addRow.bind(this, index)}
        removeRow={this.removeRow.bind(this, index)}
        autofocus={this.state.autofocus === id}
        changeFocus={this.changeFocus}
        addRowDisabled={addRowDisabled}
        disabled={this.props.disabled}
        keyPlaceholder={keyPlaceholder}
        kvDelimiter={kvDelimiter}
        inputDropdownOptions={this.props.inputDropdownOptions}
        outputDropdownOptions={this.props.outputDropdownOptions}
        forwardedRef={this.values[id].ref}
        errors={this.props.errors}
        hasOutput={this.props.hasOutput}
      />
    );
  };
}

export default function DataMappingWidget(props) {
  return (
    <ThemeWrapper>
      <DataMappingWidgetView {...props} />
    </ThemeWrapper>
  );
}
