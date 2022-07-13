import * as React from 'react';
import { Select, MenuItem } from '@material-ui/core';
import AbstractMultiRowWidget, {
  IMultiRowProps,
  IMultiRowWidgetProps,
} from 'components/AbstractWidget/AbstractMultiRowWidget';
import ThemeWrapper from 'components/ThemeWrapper';

interface IGraphProps extends IMultiRowProps<IMultiRowWidgetProps> {
  dropdownOptions: any[];
}

class GraphVertexEdgeProperties extends AbstractMultiRowWidget<IGraphProps> {
  public renderRow = (id, index) => {
    return (
      <Select onChange={() => {}} displayEmpty={true} data-cy={'key'}>
        {this.props.dropdownOptions.map((option) => (
          <MenuItem value={option} key={option} data-cy={`${'value'}-${option}`}>
            {option}
          </MenuItem>
        ))}
      </Select>
    );
  };
}

export default function GraphVertexEdgePropertiesWidget(props) {
  return (
    <ThemeWrapper>
      <GraphVertexEdgeProperties {...props} />
    </ThemeWrapper>
  );
}
