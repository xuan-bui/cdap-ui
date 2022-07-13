/*
 * Copyright © 2018-2019 Cask Data, Inc.
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
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { getCurrentNamespace } from 'services/NamespaceStore';
import T from 'i18n-react';
import LoadingSVG from 'components/shared/LoadingSVG';
import MyDataPrepApi from 'api/dataprep';
import CardActionFeedback, { CARD_ACTION_TYPES } from 'components/shared/CardActionFeedback';
import { objectQuery } from 'services/helpers';
import BtnWithLoading from 'components/shared/BtnWithLoading';
import { ConnectionType } from 'components/DataPrepConnections/ConnectionType';

const PREFIX = 'features.DataPrepConnections.AddConnections.ADLS';
const ADDCONN_PREFIX = 'features.DataPrepConnections.AddConnections';

const LABEL_COL_CLASS = 'col-3 col-form-label text-right';
const INPUT_COL_CLASS = 'col-8';

require('./ADLSConnection.scss');

enum ConnectionMode {
  Add = 'ADD',
  Edit = 'EDIT',
  Duplicate = 'DUPLICATE',
}

interface IADLSConnectionProps {
  close: () => void;
  onAdd: () => void;
  mode: ConnectionMode;
  connectionId: string;
}

interface IADLSConnectionState {
  error?: string | object | null;
  name?: string;
  accountFQDN?: string;
  clientID?: string;
  clientSecret?: string;
  refreshURL?: string;
  testConnectionLoading?: boolean;
  connectionResult?: {
    message?: string;
    type?: string;
  };
  loading?: boolean;
}

interface IProperties {
  accountFQDN?: string;
  clientID?: string;
  clientSecret?: string;
  refreshURL?: string;
  testConnectionLoading?: boolean;
}

export default class ADLSConnection extends React.PureComponent<
  IADLSConnectionProps,
  IADLSConnectionState
> {
  public state: IADLSConnectionState = {
    error: null,
    name: '',
    clientID: '',
    clientSecret: '',
    refreshURL: '',
    accountFQDN: '',
    testConnectionLoading: false,
    connectionResult: {
      message: '',
      type: '',
    },
    loading: false,
  };

  public componentDidMount() {
    if (this.props.mode === ConnectionMode.Add) {
      return;
    }

    this.setState({ loading: true });

    const namespace = getCurrentNamespace();

    const params = {
      context: namespace,
      connectionId: this.props.connectionId,
    };

    MyDataPrepApi.getConnection(params).subscribe(
      (res) => {
        const name = this.props.mode === ConnectionMode.Edit ? res.name : '';
        const accountFQDN = objectQuery(res, 'properties', 'accountFQDN');
        const clientID = objectQuery(res, 'properties', 'clientID');
        const clientSecret = objectQuery(res, 'properties', 'clientSecret');
        const refreshURL = objectQuery(res, 'properties', 'refreshURL');

        this.setState({
          name,
          accountFQDN,
          clientID,
          clientSecret,
          refreshURL,
          loading: false,
        });
      },
      (err) => {
        const error =
          objectQuery(err, 'response', 'message') || objectQuery(err, 'response') || err;

        this.setState({
          loading: false,
          error,
        });
      }
    );
  }

  private constructProperties = (): IProperties => {
    const properties: IProperties = {};

    if (this.state.clientID && this.state.clientID.length > 0) {
      properties.clientID = this.state.clientID;
    }
    if (this.state.clientSecret && this.state.clientSecret.length > 0) {
      properties.clientSecret = this.state.clientSecret;
    }
    if (this.state.refreshURL && this.state.refreshURL.length > 0) {
      properties.refreshURL = this.state.refreshURL;
    }
    if (this.state.accountFQDN && this.state.accountFQDN.length > 0) {
      properties.accountFQDN = this.state.accountFQDN;
    }

    return properties;
  };

  private addConnection = () => {
    const namespace = getCurrentNamespace();

    const requestBody = {
      name: this.state.name,
      type: ConnectionType.ADLS,
      properties: this.constructProperties(),
    };

    MyDataPrepApi.createConnection({ context: namespace }, requestBody).subscribe(
      () => {
        this.setState({ error: null });
        this.props.onAdd();
        this.props.close();
      },
      (err) => {
        const error =
          objectQuery(err, 'response', 'message') || objectQuery(err, 'response') || err;
        this.setState({ error });
      }
    );
  };

  private editConnection = () => {
    const namespace = getCurrentNamespace();

    const params = {
      context: namespace,
      connectionId: this.props.connectionId,
    };

    const requestBody = {
      name: this.state.name,
      id: this.props.connectionId,
      type: ConnectionType.ADLS,
      properties: this.constructProperties(),
    };

    MyDataPrepApi.updateConnection(params, requestBody).subscribe(
      () => {
        this.setState({ error: null });
        this.props.onAdd();
        this.props.close();
      },
      (err) => {
        const error =
          objectQuery(err, 'response', 'message') || objectQuery(err, 'response') || err;
        this.setState({ error });
      }
    );
  };

  private testConnection = () => {
    this.setState({
      testConnectionLoading: true,
      connectionResult: {
        message: '',
        type: '',
      },
      error: null,
    });

    const namespace = getCurrentNamespace();

    const requestBody = {
      name: this.state.name,
      type: ConnectionType.ADLS,
      properties: this.constructProperties(),
    };

    MyDataPrepApi.adlsTestConnection({ context: namespace }, requestBody).subscribe(
      (res) => {
        this.setState({
          connectionResult: {
            type: CARD_ACTION_TYPES.SUCCESS,
            message: res.message,
          },
          testConnectionLoading: false,
        });
      },
      (err) => {
        const errorMessage =
          objectQuery(err, 'response', 'message') ||
          objectQuery(err, 'response') ||
          T.translate(`${PREFIX}.defaultTestErrorMessage`);

        this.setState({
          connectionResult: {
            type: CARD_ACTION_TYPES.DANGER,
            message: errorMessage,
          },
          testConnectionLoading: false,
        });
      }
    );
  };

  private handleChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      [key]: e.target.value,
    });
  };

  private isButtonDisabled = () => {
    const disabled =
      !(
        this.state.name &&
        this.state.accountFQDN &&
        this.state.clientID &&
        this.state.clientSecret &&
        this.state.refreshURL
      ) || this.state.testConnectionLoading;

    return disabled;
  };

  private renderTestButton = () => {
    const disabled = this.isButtonDisabled();

    return (
      <span className="test-connection-button">
        <BtnWithLoading
          className="btn btn-secondary"
          onClick={this.testConnection}
          disabled={disabled}
          loading={this.state.testConnectionLoading}
          label={T.translate(`${PREFIX}.testConnection`)}
          darker={true}
        />
      </span>
    );
  };

  private renderAddConnectionButton = () => {
    const disabled = this.isButtonDisabled();

    let onClickFn = this.addConnection;

    if (this.props.mode === ConnectionMode.Edit) {
      onClickFn = this.editConnection;
    }

    return (
      <ModalFooter>
        <button className="btn btn-primary" onClick={onClickFn} disabled={disabled}>
          {T.translate(`${PREFIX}.Buttons.${this.props.mode}`)}
        </button>

        {this.renderTestButton()}
      </ModalFooter>
    );
  };

  private renderContent() {
    if (this.state.loading) {
      return (
        <div className="adls-detail text-xs-center">
          <br />
          <LoadingSVG />
        </div>
      );
    }

    return (
      <div className="adls-detail">
        <div className="form">
          <div className="form-group row">
            <label className={LABEL_COL_CLASS}>
              {T.translate(`${PREFIX}.name`)}
              <span className="asterisk">*</span>
            </label>
            <div className={INPUT_COL_CLASS}>
              <div className="input-text">
                <input
                  type="text"
                  className="form-control"
                  value={this.state.name}
                  onChange={this.handleChange.bind(this, 'name')}
                  disabled={this.props.mode === ConnectionMode.Edit}
                  placeholder={T.translate(`${PREFIX}.Placeholders.name`).toString()}
                />
              </div>
            </div>
          </div>

          <div className="form-group row">
            <label className={LABEL_COL_CLASS}>
              {T.translate(`${PREFIX}.accountFQDN`)}
              <span className="asterisk">*</span>
            </label>
            <div className={INPUT_COL_CLASS}>
              <div className="input-text">
                <input
                  type="text"
                  className="form-control"
                  value={this.state.accountFQDN}
                  onChange={this.handleChange.bind(this, 'accountFQDN')}
                  placeholder={T.translate(`${PREFIX}.Placeholders.accountFQDN`).toString()}
                />
              </div>
            </div>
          </div>

          <div className="adls-gen1">
            <div className="form-group row">
              <label className={LABEL_COL_CLASS}>
                {T.translate(`${PREFIX}.clientID`)}
                <span className="asterisk">*</span>
              </label>
              <div className={INPUT_COL_CLASS}>
                <div className="input-text">
                  <input
                    type="text"
                    className="form-control"
                    value={this.state.clientID || ''}
                    onChange={this.handleChange.bind(this, 'clientID')}
                    placeholder={T.translate(`${PREFIX}.Placeholders.clientID`).toString()}
                  />
                </div>
              </div>
            </div>

            <div className="form-group row">
              <label className={LABEL_COL_CLASS}>
                {T.translate(`${PREFIX}.clientSecret`)}
                <span className="asterisk">*</span>
              </label>
              <div className={INPUT_COL_CLASS}>
                <div className="input-text">
                  <input
                    type="text"
                    className="form-control"
                    value={this.state.clientSecret || ''}
                    onChange={this.handleChange.bind(this, 'clientSecret')}
                    placeholder={T.translate(`${PREFIX}.Placeholders.clientSecret`).toString()}
                  />
                </div>
              </div>
            </div>

            <div className="form-group row">
              <label className={LABEL_COL_CLASS}>
                {T.translate(`${PREFIX}.refreshURL`)}
                <span className="asterisk">*</span>
              </label>
              <div className={INPUT_COL_CLASS}>
                <div className="input-text">
                  <input
                    type="text"
                    className="form-control"
                    value={this.state.refreshURL || ''}
                    onChange={this.handleChange.bind(this, 'refreshURL')}
                    placeholder={T.translate(`${PREFIX}.Placeholders.refreshURL`).toString()}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderMessage() {
    const connectionResult = this.state.connectionResult;

    if (!this.state.error && !connectionResult.message) {
      return null;
    }

    if (this.state.error) {
      return (
        <CardActionFeedback
          type={CARD_ACTION_TYPES.DANGER}
          message={T.translate(`${PREFIX}.ErrorMessages.${this.props.mode}`)}
          extendedMessage={this.state.error}
        />
      );
    }

    const connectionResultType = connectionResult.type;
    const extendedMessage =
      connectionResultType === CARD_ACTION_TYPES.SUCCESS ? null : connectionResult.message;

    return (
      <CardActionFeedback
        message={T.translate(
          `${ADDCONN_PREFIX}.TestConnectionLabels.${connectionResultType.toLowerCase()}`
        )}
        extendedMessage={extendedMessage}
        type={connectionResultType}
      />
    );
  }

  private renderModalFooter = () => {
    return this.renderAddConnectionButton();
  };

  public render() {
    return (
      <div>
        <Modal
          isOpen={true}
          toggle={this.props.close}
          size="lg"
          className="adls-connection-modal cdap-modal"
          backdrop="static"
          zIndex="1061"
        >
          <ModalHeader toggle={this.props.close}>
            {T.translate(`${PREFIX}.ModalHeader.${this.props.mode}`, {
              connection: this.props.connectionId,
            })}
          </ModalHeader>

          <ModalBody>{this.renderContent()}</ModalBody>

          {this.renderModalFooter()}
          {this.renderMessage()}
        </Modal>
      </div>
    );
  }
}
