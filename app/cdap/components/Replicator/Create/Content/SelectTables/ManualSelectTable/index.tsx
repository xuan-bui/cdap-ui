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

import React, { useEffect, useState } from 'react';
import withStyles, { WithStyles, StyleRules } from '@material-ui/core/styles/withStyles';
import { createContextConnect, ICreateContext } from 'components/Replicator/Create';
import WidgetWrapper from 'components/shared/ConfigurationGroup/WidgetWrapper';
import TableMultiRow from 'components/Replicator/Create/Content/SelectTables/ManualSelectTable/TableMultiRow';
import { generateTableKey } from 'components/Replicator/utilities';
import Heading, { HeadingTypes } from 'components/shared/Heading';
import StepButtons from 'components/Replicator/Create/Content/StepButtons';
import { List, Map } from 'immutable';
import { useFeatureFlagDefaultTrue } from 'services/react/customHooks/useFeatureFlag';
import {
  IDMLStore,
  IColumnsStore,
  ITableImmutable,
  ITablesStore,
} from 'components/Replicator/types';
import { useOnUnmount } from 'services/react/customHooks/useOnUnmount';

const styles = (): StyleRules => {
  return {
    root: {
      marginTop: '25px',
    },
    tablesInputContainer: {
      marginTop: '25px',
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 390px',
      fontWeight: 'bold',
    },
  };
};

interface IManualSelectTableProps extends ICreateContext, WithStyles<typeof styles> {}

const Database = ({ setDatabase, value }) => {
  const widget = {
    label: 'Database name',
    name: 'database',
    'widget-type': 'textbox',
    'widget-attributes': {
      placeholder: 'Set database name',
    },
  };

  const property = {
    required: true,
    name: 'database',
  };

  return (
    <WidgetWrapper
      widgetProperty={widget}
      pluginProperty={property}
      value={value}
      onChange={setDatabase}
    />
  );
};

const ManualSelectTableView: React.FC<IManualSelectTableProps> = ({
  classes,
  tables,
  dmlBlacklist,
  columns,
  setTables,
}) => {
  const [database, setDatabase] = useState('');
  const [values, setValues] = useState([]);
  const [isInitFinished, setIsInitFinished] = useState(false);
  const useReplicationTransformation = useFeatureFlagDefaultTrue(
    'replication.transformations.enabled'
  );

  useOnUnmount(() => {
    if (useReplicationTransformation) {
      handleNext();
    }
  });

  useEffect(() => {
    const formattedValues = [];
    let initDatabase = '';
    tables.toList().forEach((tableInfo) => {
      const key = generateTableKey(tableInfo);
      initDatabase = tableInfo.get('database');
      const selectedColumns = columns.get(key) ? columns.get(key).toArray() : [];

      formattedValues.push({
        table: tableInfo.get('table'),
        schema: tableInfo.get('schema'),
        dmlBlacklist: dmlBlacklist.get(key),
        columns: selectedColumns.map((columnInfo) => columnInfo.get('name')),
      });
    });

    setDatabase(initDatabase);
    setValues(formattedValues);

    setIsInitFinished(true);
  }, []);

  function handleNext() {
    if (!database || database.length === 0) {
      return;
    }

    let selectedTables: ITablesStore = Map();
    let selectedColumns: IColumnsStore = Map();
    let dml: IDMLStore = Map();

    values.forEach((row) => {
      if (!row.table || row.table.length === 0) {
        return;
      }

      const tableInfo: ITableImmutable = Map({
        database,
        table: row.table,
        schema: row.schema,
      });
      const key = generateTableKey(tableInfo);

      selectedTables = selectedTables.set(key, tableInfo);

      if (row.dmlBlacklist && row.dmlBlacklist.size > 0) {
        dml = dml.set(key, row.dmlBlacklist);
      }

      if (row.columns && row.columns.length > 0) {
        selectedColumns = selectedColumns.set(
          key,
          List(
            row.columns.map((columnName) => {
              return Map({
                name: columnName,
              });
            })
          )
        );
      }
    });

    setTables(selectedTables, selectedColumns, dml);
  }

  const nextDisabled =
    database.length === 0 ||
    values.length === 0 ||
    values.filter((row) => row.table.length > 0).length === 0;

  if (!isInitFinished) {
    return null;
  }

  return (
    <>
      <div className={classes.root}>
        <div>
          <Database value={database} setDatabase={setDatabase} />
        </div>

        <div className={classes.tablesInputContainer}>
          <Heading type={HeadingTypes.h4} label="Tables" />

          <div className={classes.tableHeader}>
            <div>Table name*</div>
            <div>Schema name</div>
            <div />
          </div>
          <TableMultiRow value={values} onChange={setValues} />
        </div>
      </div>

      <StepButtons onNext={handleNext} nextDisabled={nextDisabled} />
    </>
  );
};

const StyledManualSelectTable = withStyles(styles)(ManualSelectTableView);
const ManualSelectTable = createContextConnect(StyledManualSelectTable);
export default ManualSelectTable;
