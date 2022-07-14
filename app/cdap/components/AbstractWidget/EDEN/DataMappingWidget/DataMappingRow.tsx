import * as React from 'react';

import AbstractRow, {
  AbstractRowStyles,
  IAbstractRowProps,
} from 'components/AbstractWidget/AbstractMultiRowWidget/AbstractRow';

import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import withStyles from '@material-ui/core/styles/withStyles';

const styles = (theme) => {
  return {
    ...AbstractRowStyles(theme),
    inputFull: {
      display: 'grid',
      gridTemplateColumns: '100%',
    },
    inputContainer: {
      display: 'grid',
      gridTemplateColumns: '50% 50%',
      gridGap: '10px',
    },
    disabled: {
      color: `${theme.palette.grey['50']}`,
    },
  };
};

interface IComplexDropdown {
  value: string | number;
  label: string;
}

export type IDropdownOption = string;

interface IKeyValueDropdownRowProps extends IAbstractRowProps<typeof styles> {
  keyPlaceholder?: string;
  kvDelimiter?: string;
  inputDropdownOptions?: IDropdownOption[];
  outputDropdownOptions?: IDropdownOption[];
  hasOutput?: boolean;
}

interface IKeyValueState {
  value: string;
  key: string;
}

type StateKeys = keyof IKeyValueState;

class KeyValueDropdownRow extends AbstractRow<IKeyValueDropdownRowProps, IKeyValueState> {
  public static defaultProps = {
    keyPlaceholder: 'Key',
    kvDelimiter: ':',
    delimiter: ',',
    inputDropdownOptions: [],
    outputDropdownOptions: [],
    hasOutput: false,
  };

  public state = {
    key: '',
    value: '',
  };

  public componentDidMount() {
    // const [key = '', value = ''] = this.props.value.split(this.props.kvDelimiter);

    this.setState({
      key: this.props.value.key,
      value: this.props.value.value,
    });
  }

  private handleChange = (type: StateKeys, e) => {
    this.setState(
      {
        [type]: e.target.value,
      } as Pick<IKeyValueState, StateKeys>,
      () => {
        const key = this.state.key;
        const value = this.state.value;

        // const updatedValue = key.length > 0 ? [key, value].join(this.props.kvDelimiter) : '';
        // this.onChange(updatedValue);

        this.onChange({
          key,
          value,
        });
      }
    );
  };

  public renderInput = () => {
    const InputField = (
      <Select
        classes={{ disabled: this.props.classes.disabled }}
        value={this.state.key}
        onChange={this.handleChange.bind(this, 'key')}
        displayEmpty={true}
        disabled={this.props.disabled}
        data-cy={'key'}
      >
        {this.props.inputDropdownOptions.map((option) => (
          <MenuItem value={option} key={option} data-cy={`${'value'}-${option}`}>
            {option}
          </MenuItem>
        ))}
      </Select>
    );

    const OutputField = (
      <Select
        classes={{ disabled: this.props.classes.disabled }}
        value={this.state.value}
        onChange={this.handleChange.bind(this, 'value')}
        displayEmpty={true}
        disabled={this.props.disabled}
        data-cy={'value'}
      >
        {this.props.outputDropdownOptions.map((option) => (
          <MenuItem value={option} key={option} data-cy={`${'value'}-${option}`}>
            {option}
          </MenuItem>
        ))}
      </Select>
    );

    return (
      <div
        className={
          this.props.hasOutput ? this.props.classes.inputContainer : this.props.classes.inputFull
        }
      >
        <>
          {InputField}
          {this.props.hasOutput && OutputField}
        </>
      </div>
    );
  };
}

const StyledKeyValueDropdownRow = withStyles(styles)(KeyValueDropdownRow);
export default StyledKeyValueDropdownRow;
