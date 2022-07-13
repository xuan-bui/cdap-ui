import * as React from 'react';

import AbstractMultiRowWidget, {
  IMultiRowProps,
  IMultiRowWidgetProps,
} from 'components/AbstractWidget/AbstractMultiRowWidget';

import ThemeWrapper from 'components/ThemeWrapper';
import { WIDGET_PROPTYPES } from 'components/AbstractWidget/constants';
import { objectQuery } from 'services/helpers';
import { IField } from 'components/FieldLevelLineage/v2/Context/FllContextHelper';
import { IStageSchema } from '../..';
import DataMappingRow, { IDropdownOption } from './DataMappingRow';

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

(DataMappingWidget as any).propTypes = WIDGET_PROPTYPES;
(DataMappingWidget as any).getWidgetAttributes = () => {
  return {
    'key-placeholder': { type: 'string', required: false },
    'kv-delimiter': { type: 'string', required: false },
    delimiter: { type: 'string', required: false },
    showDelimiter: { type: 'boolean', required: false },
    inputDropdownOptions: { type: 'array', required: false },
    outputDropdownOptions: { type: 'array', required: false },
    hasOutput: { type: 'boolean', required: false },
  };
};
