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
import WidgetWrapper from 'components/shared/ConfigurationGroup/WidgetWrapper';
import StepButtons from 'components/Replicator/Create/Content/StepButtons';
import Heading, { HeadingTypes } from 'components/shared/Heading';
import { isValidEntityName, objectQuery } from 'services/helpers';
import If from 'components/shared/If';

const styles = (theme): StyleRules => {
  return {
    root: {
      padding: '30px 40px',
    },
    content: {
      width: '50%',
      maxWidth: '1000px',
      minWidth: '600px',
    },
    error: {
      marginTop: '3px',
      color: theme.palette.red[100],
    },
  };
};

const Name = ({ setName, value, error }) => {
  const widget = {
    label: 'Name',
    name: 'name',
    'widget-type': 'textbox',
    'widget-attributes': {
      placeholder:
        'Specify a name containing alphanumeric characters, underscores, and dashes only',
    },
  };

  const property = {
    required: true,
    name: 'name',
  };

  return (
    <WidgetWrapper
      widgetProperty={widget}
      pluginProperty={property}
      value={value}
      onChange={setName}
      errors={error}
    />
  );
};

const Description = ({ setDescription, value }) => {
  const widget = {
    label: 'Description',
    name: 'description',
    'widget-type': 'textbox',
    'widget-attributes': {
      placeholder: 'Enter a description',
    },
  };

  const property = {
    required: false,
    name: 'description',
  };

  return (
    <WidgetWrapper
      widgetProperty={widget}
      pluginProperty={property}
      value={value}
      onChange={setDescription}
    />
  );
};

type INameDescriptionProps = ICreateContext & WithStyles<typeof styles>;

const NameDescriptionView: React.FC<INameDescriptionProps> = ({
  classes,
  name,
  description,
  setNameDescription,
}) => {
  const [localName, setLocalName] = useState(name);
  const [nameError, setNameError] = useState(null);
  const [localDescription, setLocalDescription] = useState(description);
  const nameRef = useRef(localName);
  const descRef = useRef(localDescription);

  useEffect(() => {
    nameRef.current = localName;
  }, [localName]);

  useEffect(() => {
    descRef.current = localDescription;
  }, [localDescription]);

  useEffect(() => {
    return () => {
      handleSave();
    };
  }, []);

  const handleSave = () => {
    setNameDescription(nameRef.current, descRef.current);
  };

  function handleNameChange(value) {
    setLocalName(value);

    if (value.length > 64) {
      const errorArr = [
        {
          msg: 'Name cannot be longer than 64 characters.',
        },
      ];
      setNameError(errorArr);
    } else if (!isValidEntityName(value)) {
      const errorArr = [
        {
          msg: 'Name is required. Name may only contain alphanumeric, -, and _',
        },
      ];
      setNameError(errorArr);
    } else {
      setNameError(null);
    }
  }

  const errorMessage = objectQuery(nameError, 0, 'msg');

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <Heading type={HeadingTypes.h3} label="Specify basic information" />
        <br />
        <Name value={localName} setName={handleNameChange} error={nameError} />
        <If condition={!!nameError}>
          <div className={classes.error}>{errorMessage}</div>
        </If>
        <br />
        <br />
        <Description value={localDescription} setDescription={setLocalDescription} />
      </div>

      <StepButtons onNext={handleSave} nextDisabled={nameError || localName.length === 0} />
    </div>
  );
};

const StyledNameDescription = withStyles(styles)(NameDescriptionView);
const NameDescription = createContextConnect(StyledNameDescription);
export default NameDescription;
