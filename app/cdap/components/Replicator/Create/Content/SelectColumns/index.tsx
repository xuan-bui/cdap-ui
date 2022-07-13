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
import T from 'i18n-react';
import withStyles, { WithStyles, StyleRules } from '@material-ui/core/styles/withStyles';
import { createContextConnect } from 'components/Replicator/Create';
import { Map } from 'immutable';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import { getCurrentNamespace } from 'services/NamespaceStore';
import { MyReplicatorApi } from 'api/replicator';
import Checkbox from '@material-ui/core/Checkbox';
import LoadingSVG from 'components/shared/LoadingSVG';
import Heading, { HeadingTypes } from 'components/shared/Heading';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import If from 'components/shared/If';
import SearchBox from 'components/Replicator/Create/Content/SearchBox';
import debounce from 'lodash/debounce';
import { IColumnsList, IColumnImmutable, ITableInfo } from 'components/Replicator/types';

const I18N_PREFIX = 'features.Replication.Create.Content.SelectColumns';

const styles = (theme): StyleRules => {
  return {
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      zIndex: 5,
    },
    root: {
      position: 'absolute',
      top: '100px',
      right: 0,
      height: 'calc(100vh - 100px - 70px)',
      width: '750px',
      padding: '15px 30px',
      backgroundColor: theme.palette.white[50],
      border: `1px solid ${theme.palette.grey[200]}`,
      boxShadow: `0 3px 10px 1px ${theme.palette.grey[200]}`,
    },
    header: {
      display: 'grid',
      gridTemplateColumns: '75% 25%',
    },
    actionButtons: {
      textAlign: 'right',
      '& > button:not(:last-child)': {
        marginRight: '10px',
      },
    },
    gridWrapper: {
      // 100% - heading section - subtitle/search box
      height: 'calc(100% - 100px - 40px)',
      '& .grid.grid-container.grid-compact': {
        maxHeight: '100%',

        '& .grid-header': {
          zIndex: 5,
        },

        '& .grid-row': {
          gridTemplateColumns: '40px 40px 1fr 200px 55px 100px',
          alignItems: 'center',
        },

        '& > div[class^="grid-"] .grid-row > div': {
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
    },
    loadingContainer: {
      textAlign: 'center',
      marginTop: '100px',
    },
    replicateSelectionRadio: {
      marginRight: '10px',
    },
    radioContainer: {
      paddingLeft: '10px',
      marginTop: '15px',
      marginBottom: '5px',
    },
    radio: {
      padding: 0,
    },
    subtitleContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',

      '& > div': {
        marginRight: '25px',
      },
    },
    overlay: {
      backgroundColor: theme.palette.white[50],
      opacity: 0.7,
      top: '100px',
      bottom: 0,
      left: 0,
      right: 0,
      position: 'absolute',
      zIndex: 6, // to beat grid-header z-index
    },
  };
};

interface ISelectColumnsProps extends WithStyles<typeof styles> {
  tableInfo?: ITableInfo;
  onSave: (tableInfo: ITableInfo, columns: IColumnsList) => void;
  initialSelected: IColumnsList;
  toggle: () => void;
  draftId: string;
}

interface IColumn {
  name: string;
  type: string;
  nullable: boolean;
}

enum ReplicateSelect {
  all = 'ALL',
  individual = 'INDIVIDUAL',
}

interface ISelectColumnsState {
  columns: IColumn[];
  filteredColumns: IColumn[];
  primaryKeys: string[];
  selectedReplication: ReplicateSelect;
  selectedColumns: Map<string, IColumnImmutable>;
  loading: boolean;
  error: any;
  search: string;
}

class SelectColumnsView extends React.PureComponent<ISelectColumnsProps, ISelectColumnsState> {
  public state = {
    columns: [],
    filteredColumns: [],
    primaryKeys: [],
    selectedReplication: ReplicateSelect.all,
    selectedColumns: Map<string, IColumnImmutable>(),
    loading: true,
    error: null,
    search: '',
  };

  public componentDidMount() {
    this.fetchColumns();
  }

  private getInitialSelectedColumns = (columns): Map<string, IColumnImmutable> => {
    const existingColumns = {};
    columns.forEach((column) => {
      existingColumns[column.name] = true;
    });

    let hasChange = false;

    const selectedColumns = {};
    if (this.props.initialSelected && this.props.initialSelected.size > 0) {
      this.props.initialSelected.forEach((row: IColumnImmutable) => {
        const rowName = row.get('name') as string;
        if (existingColumns[rowName]) {
          selectedColumns[rowName] = row;
        } else {
          hasChange = true;
        }
      });
    }

    const response: Map<string, IColumnImmutable> = Map(selectedColumns);

    if (hasChange) {
      this.props.onSave(this.props.tableInfo, response.toList());
    }

    return response;
  };

  private setFilteredColumns = debounce(
    (search = this.state.search, columns = this.state.columns) => {
      let filteredColumns = columns;
      if (search && search.length > 0) {
        filteredColumns = filteredColumns.filter((row) => {
          const normalizedColumn = row.name.toLowerCase();
          const normalizedSearch = search.toLowerCase();

          return normalizedColumn.indexOf(normalizedSearch) !== -1;
        });
      }

      this.setState({ filteredColumns });
    },
    300
  );

  private fetchColumns = () => {
    this.setState({
      loading: true,
    });

    const params = {
      namespace: getCurrentNamespace(),
      draftId: this.props.draftId,
    };

    const body: ITableInfo = {
      table: this.props.tableInfo.table,
      database: this.props.tableInfo.database,
    };

    if (this.props.tableInfo.schema) {
      body.schema = this.props.tableInfo.schema;
    }

    MyReplicatorApi.getTableInfo(params, body).subscribe(
      (res) => {
        const selectedColumns = this.getInitialSelectedColumns(res.columns);

        this.setState(
          {
            columns: res.columns,
            primaryKeys: res.primaryKey,
            selectedColumns,
            selectedReplication:
              selectedColumns.size === 0 ? ReplicateSelect.all : ReplicateSelect.individual,
          },
          () => {
            if (selectedColumns.size === 0) {
              this.toggleSelectAll();
            }

            this.setFilteredColumns();
          }
        );
      },
      (err) => {
        this.setState({ error: err });
      },
      () => {
        this.setState({
          loading: false,
        });
      }
    );
  };

  private handleSearch = (search) => {
    this.setState({ search });
    this.setFilteredColumns(search);
  };

  private handleSave = () => {
    const selectedList =
      this.state.selectedReplication === ReplicateSelect.all
        ? null
        : this.state.selectedColumns.toList();

    this.props.onSave(this.props.tableInfo, selectedList);
    this.props.toggle();
  };

  private toggleSelected = (row) => {
    const key = row.name;
    if (this.state.selectedColumns.get(key)) {
      this.setState({
        selectedColumns: this.state.selectedColumns.delete(key),
      });
      return;
    }

    this.setState({
      selectedColumns: this.state.selectedColumns.set(key, Map({ name: row.name, type: row.type })),
    });
  };

  private toggleSelectAll = () => {
    if (this.state.selectedColumns.size > this.state.primaryKeys.length) {
      // primary keys are required so don't remove them from the selected columns
      const primaryKeyMap = {};
      this.state.columns.forEach((row) => {
        if (this.state.primaryKeys.indexOf(row.name) !== -1) {
          primaryKeyMap[row.name] = Map({ name: row.name, type: row.type });
        }
      });

      this.setState({
        selectedColumns: Map(primaryKeyMap),
      });
      return;
    }

    const selectedMap = {};
    this.state.columns.forEach((row) => {
      selectedMap[row.name] = Map({ name: row.name, type: row.type });
    });

    this.setState({
      selectedColumns: Map(selectedMap),
    });
  };

  private handleReplicationSelection = (e) => {
    this.setState({
      selectedReplication: e.target.value,
    });
  };

  private isSaveDisabled = () => {
    if (
      this.state.selectedReplication === ReplicateSelect.individual &&
      this.state.selectedColumns.size === 0
    ) {
      return true;
    }

    return this.state.loading;
  };

  private renderContent = () => {
    const { classes } = this.props;

    return (
      <>
        <If condition={this.state.selectedReplication === ReplicateSelect.all}>
          <div className={classes.overlay} />
        </If>
        <div className={classes.subtitleContainer}>
          <div>
            {`Columns - ${this.state.selectedColumns.size} of ${this.state.columns.length} selected`}
          </div>

          <div>
            <SearchBox
              value={this.state.search}
              onChange={this.handleSearch}
              placeholder="Search by column name"
            />
          </div>
        </div>
        <div className={`grid-wrapper ${classes.gridWrapper}`}>
          <div className="grid grid-container grid-compact">
            <div className="grid-header">
              <div className="grid-row">
                <div>
                  <Checkbox
                    color="primary"
                    className={classes.radio}
                    checked={this.state.selectedColumns.size === this.state.columns.length}
                    indeterminate={
                      this.state.selectedColumns.size < this.state.columns.length &&
                      this.state.selectedColumns.size > 0
                    }
                    onChange={this.toggleSelectAll}
                  />
                </div>
                <div>#</div>
                <div>Column name</div>
                <div>Type</div>
                <div>Null</div>
                <div>Key</div>
              </div>
            </div>

            <div className="grid-body">
              {this.state.filteredColumns.map((row, i) => {
                const isPrimaryKey = this.state.primaryKeys.indexOf(row.name) !== -1;
                return (
                  <div key={row.name} className="grid-row">
                    <div
                      title={
                        isPrimaryKey
                          ? T.translate(`${I18N_PREFIX}.primaryKeyDescription`).toString()
                          : ''
                      }
                    >
                      <Checkbox
                        color="primary"
                        className={classes.radio}
                        checked={!!this.state.selectedColumns.get(row.name)}
                        disabled={isPrimaryKey}
                        onChange={this.toggleSelected.bind(this, row)}
                      />
                    </div>
                    <div>{i + 1}</div>
                    <div>{row.name}</div>
                    <div>{row.type}</div>
                    <div>
                      <Checkbox className={classes.radio} checked={row.nullable} disabled={true} />
                    </div>
                    <div>{isPrimaryKey ? 'Primary' : '--'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  };

  private renderLoading = () => {
    return (
      <div className={this.props.classes.loadingContainer}>
        <LoadingSVG />
      </div>
    );
  };

  public render() {
    if (!this.props.tableInfo) {
      return null;
    }

    const { classes } = this.props;

    return (
      <div className={classes.backdrop}>
        <div className={classes.root}>
          <div className={classes.header}>
            <div>
              <Heading type={HeadingTypes.h3} label={this.props.tableInfo.table} />
              <If condition={!this.state.loading}>
                <div className={classes.radioContainer}>
                  <RadioGroup
                    value={this.state.selectedReplication}
                    onChange={this.handleReplicationSelection}
                    className={classes.radioGroup}
                  >
                    <FormControlLabel
                      value={ReplicateSelect.all}
                      control={
                        <Radio
                          color="primary"
                          className={`${classes.radio} ${classes.replicateSelectionRadio}`}
                        />
                      }
                      label="Replicate all available columns"
                    />
                    <FormControlLabel
                      value={ReplicateSelect.individual}
                      control={
                        <Radio
                          color="primary"
                          className={`${classes.radio} ${classes.replicateSelectionRadio}`}
                        />
                      }
                      label="Select the columns to replicate"
                    />
                  </RadioGroup>
                </div>
              </If>
            </div>

            <div className={classes.actionButtons}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleSave}
                disabled={this.isSaveDisabled()}
              >
                Save
              </Button>

              <IconButton onClick={this.props.toggle}>
                <CloseIcon />
              </IconButton>
            </div>
          </div>

          {this.state.loading ? this.renderLoading() : this.renderContent()}
        </div>
      </div>
    );
  }
}

const StyledSelectColumns = withStyles(styles)(SelectColumnsView);
const SelectColumns = createContextConnect(StyledSelectColumns);
export default SelectColumns;
