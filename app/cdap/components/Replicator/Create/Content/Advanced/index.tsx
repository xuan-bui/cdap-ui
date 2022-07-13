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

import React, { useEffect, useRef, useState } from 'react';
import withStyles, { WithStyles, StyleRules } from '@material-ui/core/styles/withStyles';
import { createContextConnect, ICreateContext } from 'components/Replicator/Create';
import StepButtons from 'components/Replicator/Create/Content/StepButtons';
import WidgetWrapper from 'components/shared/ConfigurationGroup/WidgetWrapper';
import Heading, { HeadingTypes } from 'components/shared/Heading';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import If from 'components/shared/If';

const styles = (): StyleRules => {
  return {
    root: {
      padding: '30px 40px',
    },
    taskSection: {
      marginBottom: '35px',
    },
    numInstances: {
      width: '200px',
      marginLeft: '25px',
    },
    dataAmountContainer: {
      padding: '0 25px',
    },
    dataAmountSelector: {
      marginTop: '15px',
      width: '200px',
    },
    radioGroup: {
      flexDirection: 'initial',
      marginBottom: '5px',
      '& > label': {
        marginRight: '40px',
      },
    },
  };
};

const NumInstancesEditor = ({ onChange, value }) => {
  const widget = {
    label: 'Number of tasks',
    name: 'numInstance',
    'widget-type': 'number',
    'widget-attributes': {
      min: 1,
    },
  };

  const property = {
    required: true,
    name: 'numInstance',
    description:
      'The tables in a replication job are evenly distributed amongst all the tasks. Set this to a higher number to distribute the load amongst a larger number of tasks, thereby increasing the parallelism of the replication job. This value cannot be changed after the job is created.',
  };

  function handleChange(val) {
    onChange(parseInt(val, 10));
  }

  return (
    <WidgetWrapper
      widgetProperty={widget}
      pluginProperty={property}
      value={value.toString()}
      onChange={handleChange}
    />
  );
};

const options = [
  {
    value: 1,
    label: '< 1 GB / hr',
  },
];

for (let i = 1; i < 10; i++) {
  const SUFFIX = 'GB / hr';
  const MULTIPLIER = 10;
  const VALUE_MULTIPLIER = 2;
  const from = i * MULTIPLIER + 1;
  const to = (i + 1) * MULTIPLIER;

  options.push({
    value: i * VALUE_MULTIPLIER,
    label: `${from} - ${to} ${SUFFIX}`,
  });
}

const DataAmountSelector = ({ onChange, value }) => {
  const widget = {
    label: 'Number of tasks',
    name: 'numInstance',
    'widget-type': 'select',
    'widget-attributes': {
      options,
    },
  };

  const property = {
    required: false,
    name: 'dataAmount',
  };

  return (
    <WidgetWrapper
      widgetProperty={widget}
      pluginProperty={property}
      value={value.toString()}
      onChange={onChange}
      hideLabel={true}
    />
  );
};

const TASK_OPTIONS = {
  manual: 'Set number of tasks manually',
  calculate: 'Calculate number of tasks based on data',
};

const AdvancedView: React.FC<ICreateContext & WithStyles<typeof styles>> = ({
  classes,
  numInstances,
  setAdvanced,
}) => {
  const [localNumInstances, setLocalNumInstances] = useState(numInstances || 1);
  const [taskSelection, setTaskSelection] = useState(TASK_OPTIONS.calculate);
  const [dataAmount, setDataAmount] = useState(1);
  const saveRef = useRef(localNumInstances);

  useEffect(() => {
    const initialSelection = getInitialTaskSelection();
    setTaskSelection(initialSelection);
  }, []);

  useEffect(() => {
    saveRef.current = createSaveRef();
  }, [localNumInstances, taskSelection, dataAmount]);

  useEffect(() => {
    return () => {
      handleSave();
    };
  }, []);

  function getInitialTaskSelection() {
    const initialNumInstances = numInstances || 1;
    const initialDataAmount = options.find((opt) => opt.value === initialNumInstances);
    if (initialDataAmount) {
      setDataAmount(initialDataAmount.value);
      return TASK_OPTIONS.calculate;
    }

    return TASK_OPTIONS.manual;
  }

  function handleSave() {
    setAdvanced(saveRef.current);
  }

  function createSaveRef() {
    let selectedNumInstance = localNumInstances;
    if (taskSelection === TASK_OPTIONS.calculate) {
      selectedNumInstance = dataAmount;
    }

    return selectedNumInstance;
  }

  function handleSelectTask(e) {
    setTaskSelection(e.target.value);
  }

  return (
    <div className={classes.root}>
      <Heading type={HeadingTypes.h3} label="Configure advanced properties" />
      <br />

      <div className={classes.taskSection}>
        <Heading type={HeadingTypes.h4} label="Tasks" />
        <div className={classes.numTasksRadio}>
          <RadioGroup
            value={taskSelection}
            onChange={handleSelectTask}
            className={classes.radioGroup}
          >
            <FormControlLabel
              value={TASK_OPTIONS.calculate}
              control={<Radio color="primary" />}
              label={TASK_OPTIONS.calculate}
            />
            <FormControlLabel
              value={TASK_OPTIONS.manual}
              control={<Radio color="primary" />}
              label={TASK_OPTIONS.manual}
            />
          </RadioGroup>
        </div>
        <If condition={taskSelection === TASK_OPTIONS.manual}>
          <div className={classes.numInstances}>
            <NumInstancesEditor value={localNumInstances} onChange={setLocalNumInstances} />
          </div>
        </If>
        <If condition={taskSelection === TASK_OPTIONS.calculate}>
          <div className={classes.dataAmountContainer}>
            <div>How much data are you replicating in an hour?</div>
            <div className={classes.dataAmountSelector}>
              <DataAmountSelector value={dataAmount} onChange={setDataAmount} />
            </div>
          </div>
        </If>
      </div>

      <StepButtons onPrevious={handleSave} onNext={handleSave} />
    </div>
  );
};

const StyledAdvanced = withStyles(styles)(AdvancedView);
const Advanced = createContextConnect(StyledAdvanced);
export default Advanced;
