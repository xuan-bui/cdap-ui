/*
 * Copyright © 2016-2018 Cask Data, Inc.
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
import React from 'react';
import { Col, FormGroup, Label, Form } from 'reactstrap';
import AddNamespaceStore from 'services/WizardStores/AddNamespace/AddNamespaceStore';
import AddNamespaceActions from 'services/WizardStores/AddNamespace/AddNamespaceActions';
import T from 'i18n-react';
import InputWithValidations from 'components/InputWithValidations';
import { Provider, connect } from 'react-redux';

// HDFS Root Directory
const mapStateToHDFSRootDirectoryProps = (state) => {
  return {
    value: state.hadoopMapping.hdfsDirectory,
    type: 'text',
    placeholder: T.translate(
      'features.Wizard.Add-Namespace.HadoopMappingStep.hdfs-root-directory-placeholder'
    ),
    disabled: state.editableFields.fields.indexOf('hdfsDirectory') === -1,
  };
};

const mapDispatchToHDFSRootDirectoryProps = (dispatch) => {
  return {
    onChange: (e) => {
      dispatch({
        type: AddNamespaceActions.setHDFSDirectory,
        payload: { hdfsDirectory: e.target.value },
      });
    },
  };
};

// Hive Database Name
const mapStateToHiveDatabaseNameProps = (state) => {
  return {
    value: state.hadoopMapping.hiveDatabaseName,
    type: 'text',
    placeholder: T.translate(
      'features.Wizard.Add-Namespace.HadoopMappingStep.hive-db-name-placeholder'
    ),
    disabled: state.editableFields.fields.indexOf('hiveDatabaseName') === -1,
  };
};

const mapDispatchToHiveDatabaseNameProps = (dispatch) => {
  return {
    onChange: (e) => {
      dispatch({
        type: AddNamespaceActions.setHiveDatabaseName,
        payload: { hiveDatabaseName: e.target.value },
      });
    },
  };
};

// HBASE Namespace Name
const mapStateToHBASENamespaceNameProps = (state) => {
  return {
    value: state.hadoopMapping.hbaseNamespace,
    type: 'text',
    placeholder: T.translate(
      'features.Wizard.Add-Namespace.HadoopMappingStep.hbase-nm-name-placeholder'
    ),
    disabled: state.editableFields.fields.indexOf('hbaseNamespace') === -1,
  };
};

const mapDispatchToHBASENamespaceNameProps = (dispatch) => {
  return {
    onChange: (e) => {
      dispatch({
        type: AddNamespaceActions.setHBaseNamespace,
        payload: { hbaseNamespace: e.target.value },
      });
    },
  };
};

const mapStateToSchedulerQueueNameProps = (state) => {
  return {
    value: state.hadoopMapping.schedulerQueueName,
    type: 'text',
    placeholder: T.translate(
      'features.Wizard.Add-Namespace.HadoopMappingStep.scheduler-queue-placeholder'
    ),
    disabled: state.editableFields.fields.indexOf('schedulerQueueName') === -1,
  };
};
const mapDispatchToSchedulerQueueNameProps = (dispatch) => {
  return {
    onChange: (e) => {
      dispatch({
        type: AddNamespaceActions.setSchedulerQueueName,
        payload: { schedulerQueueName: e.target.value },
      });
    },
  };
};

const InputRootDirectory = connect(
  mapStateToHDFSRootDirectoryProps,
  mapDispatchToHDFSRootDirectoryProps
)(InputWithValidations);

const InputHiveDbName = connect(
  mapStateToHiveDatabaseNameProps,
  mapDispatchToHiveDatabaseNameProps
)(InputWithValidations);

const InputHbaseNamespace = connect(
  mapStateToHBASENamespaceNameProps,
  mapDispatchToHBASENamespaceNameProps
)(InputWithValidations);

const InputSchedulerQueueName = connect(
  mapStateToSchedulerQueueNameProps,
  mapDispatchToSchedulerQueueNameProps
)(InputWithValidations);
export default function MappingStep() {
  return (
    <Provider store={AddNamespaceStore}>
      <Form
        className="form-horizontal mapping-step"
        onSubmit={(e) => {
          e.preventDefault();
          return false;
        }}
      >
        <FormGroup row>
          <Col xs="3">
            <Label className="control-label">
              {T.translate(
                'features.Wizard.Add-Namespace.HadoopMappingStep.hdfs-root-directory-label'
              )}
            </Label>
          </Col>
          <Col xs="7">
            <InputRootDirectory />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col xs="3">
            <Label className="control-label">
              {T.translate('features.Wizard.Add-Namespace.HadoopMappingStep.hive-db-name-label')}
            </Label>
          </Col>
          <Col xs="7">
            <InputHiveDbName />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col xs="3">
            <Label className="control-label">
              {T.translate('features.Wizard.Add-Namespace.HadoopMappingStep.hbase-nm-name-label')}
            </Label>
          </Col>
          <Col xs="7">
            <InputHbaseNamespace />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col xs="3">
            <Label className="control-label">
              {T.translate('features.Wizard.Add-Namespace.HadoopMappingStep.scheduler-queue-name')}
            </Label>
          </Col>
          <Col xs="7">
            <InputSchedulerQueueName />
          </Col>
        </FormGroup>
      </Form>
    </Provider>
  );
}
