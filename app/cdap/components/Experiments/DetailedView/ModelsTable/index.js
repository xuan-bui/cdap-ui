/*
 * Copyright © 2017-2018 Cask Data, Inc.
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

import PropTypes from 'prop-types';
import React from 'react';
import PaginationWithTitle from 'components/shared/PaginationWithTitle';
import IconSVG from 'components/shared/IconSVG';
import { connect } from 'react-redux';
import {
  handleModelsPageChange,
  handleModelsSorting,
  setActiveModel,
  setExperimentDetailError,
  getModelStatus,
} from 'components/Experiments/store/ExperimentDetailActionCreator';
import { getAlgorithmLabel } from 'components/Experiments/store/SharedActionCreator';
import { humanReadableDate, roundDecimalToNDigits } from 'services/helpers';
import { NUMBER_TYPES } from 'services/global-constants';
import classnames from 'classnames';
import LoadingSVGCentered from 'components/shared/LoadingSVGCentered';
import { objectQuery, humanReadableNumber, HUMANREADABLE_DECIMAL } from 'services/helpers';
import isEmpty from 'lodash/isEmpty';
import ModelStatusIndicator from 'components/Experiments/DetailedView/ModelStatusIndicator';
import { Link } from 'react-router-dom';
import { getCurrentNamespace } from 'services/NamespaceStore';
import DeleteModelBtn from 'components/Experiments/DetailedView/DeleteModelBtn';
import DeleteExperimentBtn from 'components/Experiments/DetailedView/DeleteExperimentBtn';
import HyperParamsPopover from 'components/Experiments/DetailedView/HyperParamsPopover';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import uuidV4 from 'uuid/v4';
import CopyableID from 'components/CopyableID';
import CollapsibleWrapper from 'components/shared/CollapsibleWrapper';
import LoadingSVG from 'components/shared/LoadingSVG';
import Alert from 'components/shared/Alert';
import { MODEL_STATUS } from 'components/Experiments/store/ModelStatus';
import PredictionDatasetExploreModal from 'components/Experiments/DetailedView/PredictionDatasetExploreModal';
import AddModelToPipelineBtn from 'components/Experiments/DetailedView/AddModelToPipelineBtn';
import T from 'i18n-react';

const PREFIX = 'features.Experiments.DetailedView';

require('./DetailedViewModelsTable.scss');
const MODELSTATES = [
  MODEL_STATUS.PREPARING,
  MODEL_STATUS.SPLITTING,
  MODEL_STATUS.DATA_READY,
  MODEL_STATUS.SPLIT_FAILED,
];
let tableHeaders = [
  {
    label: T.translate(`${PREFIX}.modelName`),
    property: 'name',
  },
  {
    label: T.translate(`${PREFIX}.status`),
    property: 'status',
  },
  {
    label: T.translate(`${PREFIX}.algorithm`),
    property: 'algorithm',
  },
];

const regressionMetrics = [
  {
    label: T.translate(`${PREFIX}.rmse`),
    property: 'rmse',
  },
  {
    label: T.translate(`${PREFIX}.r2`),
    property: 'r2',
  },
  {
    label: T.translate(`${PREFIX}.evariance`),
    property: 'evariance',
  },
  {
    label: T.translate(`${PREFIX}.mae`),
    property: 'mae',
  },
];

const categoricalMetrics = [
  {
    label: T.translate(`${PREFIX}.precision`),
    property: 'precision',
  },
  {
    label: T.translate(`${PREFIX}.recall`),
    property: 'recall',
  },
  {
    label: T.translate(`${PREFIX}.f1`),
    property: 'f1',
  },
];

const addMetricsToHeaders = (tableHeaders, metrics) => [
  ...tableHeaders.slice(0, tableHeaders.length),
  ...metrics,
  ...tableHeaders.slice(tableHeaders.length),
];

const getNewHeadersBasedOnOutcome = (outcomeType) =>
  NUMBER_TYPES.indexOf(outcomeType) !== -1
    ? addMetricsToHeaders(tableHeaders, regressionMetrics)
    : addMetricsToHeaders(tableHeaders, categoricalMetrics);

const addDetailedModelObject = (list) => {
  let activeIndex = list.findIndex((model) => model.active);
  if (activeIndex !== -1) {
    return [
      ...list.slice(0, activeIndex + 1),
      {
        ...list[activeIndex],
        detailedView: true,
        active: false,
      },
      ...list.slice(activeIndex + 1),
    ];
  }
  return list;
};

const wrapContentWithTitleAttr = (content, key) => (
  <div title={isNumber(content) || isString(content) ? content : ''} key={key}>
    {content}
  </div>
);
const wrapMetricWithTitleAttr = (content, property) => {
  const ROUNDABLE_METRIC = regressionMetrics.map((metric) => metric.property);
  if (ROUNDABLE_METRIC.indexOf(property) !== -1) {
    return wrapContentWithTitleAttr(
      humanReadableNumber(roundDecimalToNDigits(content, 4), HUMANREADABLE_DECIMAL),
      property
    );
  }
  return wrapContentWithTitleAttr(content, property);
};
const renderMetrics = (newHeaders, model) => {
  let commonHeadersLen = tableHeaders.length;
  let len = newHeaders.length;
  let metrics = newHeaders.slice(commonHeadersLen, len);
  return metrics.map((t) =>
    wrapMetricWithTitleAttr(model.evaluationMetrics[t.property] || '--', t.property)
  );
};

const renderFeaturesTable = (features) => {
  return (
    <div className="grid-wrapper">
      <div className="grid grid-container">
        <div className="grid-header">
          <div className="grid-row">
            <strong> Features ({features.length})</strong>
          </div>
        </div>
        <div className="grid-body">
          {features.map((feature) => (
            <div key={feature} className="grid-row">
              {' '}
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const renderDirectivesTables = (directives) => {
  const copyableDirectives = directives.join('\n');
  return (
    <div className="grid-wrapper">
      <div className="grid grid-container directives-list">
        <div className="grid-header">
          <div className="grid-row">
            <strong> Directives ({directives.length})</strong>
            <CopyableID
              label={T.translate(`${PREFIX}.copyToClipboard`)}
              id={copyableDirectives}
              tooltipText={false}
            />
          </div>
        </div>
        <div className="grid-body">
          {directives.map((directive, i) => (
            <div key={i} className="grid-row">
              {' '}
              {directive}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const constructModelTrainingLogs = (model, experimentId) => {
  let splitId = objectQuery(model, 'splitDetails', 'id');
  let startTime = Math.floor(model.createtime / 1000);
  let endTime = model.trainedtime === -1 ? model.trainingtime : model.trainedtime;
  endTime = Math.floor(endTime / 1000);
  if (splitId) {
    let baseUrl = `/logviewer/view?namespace=${getCurrentNamespace()}&appId=ModelManagementApp&programType=spark&programId=ModelManagerService`;
    let queryParams = `&filter=${encodeURIComponent(
      `MDC:experiment="${experimentId}" AND MDC:model=${model.id}`
    )}&startTime=${startTime}&endTime=${endTime}`;
    return `${baseUrl}${queryParams}`;
  }
};

const renderModelDetails = (model, newlyTrainingModel, experimentId) => {
  let newlyTrainingModelId = objectQuery(newlyTrainingModel, 'modelId');
  let props = {
    className: classnames('grid-row', {
      opened: model.detailedView,
      active: model.active,
      highlight: model.id === newlyTrainingModelId,
      loading: !model.splitDetails,
    }),
    key: uuidV4(),
  };
  if (!model.splitDetails) {
    return (
      <div {...props}>
        <LoadingSVG />
      </div>
    );
  }
  let directives = objectQuery(model, 'splitDetails', 'directives') || [];
  let splitId = objectQuery(model, 'splitDetails', 'id');
  let modelTrainingLogsUrl;
  let directivesCount = Array.isArray(directives) ? directives.length : 0;
  let featuresCount = Array.isArray(model.features) ? model.features.length : 0;

  modelTrainingLogsUrl = constructModelTrainingLogs(model, experimentId);
  return (
    <div {...props}>
      <div className="content-wrapper">
        <div />
        <div>
          <div>
            <strong>{T.translate(`${PREFIX}.modelDescription`)}</strong>
            <div>{model.description || '--'}</div>
          </div>
          <div>
            <strong> Directives ({directivesCount}) </strong>
            <div>
              <CollapsibleWrapper
                content={directivesCount ? `${directives[0]}...` : '--'}
                popoverContent={renderDirectivesTables.bind(null, directives)}
                alwaysShowViewLink={true}
              />
            </div>
          </div>
        </div>
        <div>
          <div>
            <strong>Features ({featuresCount}) </strong>
            <div>
              <CollapsibleWrapper
                content={featuresCount ? model.features.join(',') : '--'}
                popoverContent={renderFeaturesTable.bind(null, model.features)}
              />
            </div>
          </div>
        </div>
        <div>
          <div>
            <strong> Created on</strong>
            <div>{humanReadableDate(model.createtime, true)}</div>
          </div>
        </div>
        <div>
          <div>
            <strong> Model ID </strong>
            <CopyableID
              id={model.id}
              label={T.translate(`${PREFIX}.copyToClipboard`)}
              placement="left"
            />
          </div>
          {splitId ? (
            <div>
              <strong>{T.translate(`${PREFIX}.modelTrainingLogs`)}</strong>
              <a href={modelTrainingLogsUrl} target="_blank" rel="noopener noreferrer">
                {' '}
                Logs{' '}
              </a>
            </div>
          ) : null}
        </div>
      </div>
      <div className="model-action-btns">
        <AddModelToPipelineBtn
          modelName={model.name}
          modelId={model.id}
          disabled={model.status === MODEL_STATUS.TRAINING_FAILED}
        />
        <PredictionDatasetExploreModal
          predictionDataset={model.predictionsDataset}
          disabled={model.status === MODEL_STATUS.TRAINING_FAILED}
        />
      </div>
    </div>
  );
};

const renderModel = (
  model,
  outcomeType,
  experimentId,
  newlyTrainingModel,
  statusIsLoading,
  statusIsError
) => {
  let newHeaders = getNewHeadersBasedOnOutcome(outcomeType);
  let newlyTrainingModelId = objectQuery(newlyTrainingModel, 'modelId');
  let Component = 'div';
  let props = {
    className: classnames('grid-row grid-link', {
      opened: model.detailedView,
      active: model.active,
      highlight: model.id === newlyTrainingModelId,
    }),
    key: uuidV4(),
  };
  let inSplitStep = MODELSTATES.indexOf(model.status) !== -1;
  if (inSplitStep) {
    Component = Link;
    props.to = `/ns/${getCurrentNamespace()}/experiments/create?experimentId=${experimentId}&modelId=${
      model.id
    }`;
  }

  const modelStatusComp = () => {
    return (
      <ModelStatusIndicator
        status={model.status || '--'}
        loading={statusIsLoading}
        error={statusIsError}
        model={model}
        getModelStatus={getModelStatus.bind(this, experimentId, model.id)}
      />
    );
  };

  return (
    <Component {...props} onClick={setActiveModel.bind(null, model.id)}>
      {wrapContentWithTitleAttr(
        <IconSVG name={model.active ? 'icon-caret-down' : 'icon-caret-right'} />
      )}
      {wrapContentWithTitleAttr(model.name)}
      {wrapContentWithTitleAttr(modelStatusComp())}
      {wrapContentWithTitleAttr(
        !inSplitStep ? (
          <span className="algorithm-cell" title={model.algorithmLabel}>
            <HyperParamsPopover
              hyperparameters={model.hyperparameters}
              algorithm={model.algorithm}
            />
            <span>{model.algorithmLabel}</span>
          </span>
        ) : (
          '--'
        )
      )}
      {renderMetrics(newHeaders, model, experimentId)}
      {
        <div className="grid-item-sm">
          <DeleteModelBtn experimentId={experimentId} model={model} />
        </div>
      }
    </Component>
  );
};

function renderGridBody(
  models,
  outcomeType,
  experimentId,
  newlyTrainingModel,
  modelsLoading,
  modelsWithError
) {
  let list = addDetailedModelObject([...models]);
  return list.map((model) => {
    let { name, algorithm, hyperparameters } = model;
    model = {
      ...model,
      name,
      algorithmLabel: getAlgorithmLabel(algorithm),
      hyperparameters,
    };
    let statusIsLoading = modelsLoading.indexOf(model.id) !== -1;
    let statusIsError = modelsWithError.indexOf(model.id) !== -1;

    if (model.detailedView) {
      return renderModelDetails(model, newlyTrainingModel, experimentId);
    }
    return renderModel(
      model,
      outcomeType,
      experimentId,
      newlyTrainingModel,
      statusIsLoading,
      statusIsError
    );
  });
}

function renderGrid(
  models,
  outcomeType,
  experimentId,
  newlyTrainingModel,
  modelsSortColumn,
  modelsSortMethod,
  modelsLoading,
  modelsWithError
) {
  let newHeaders = getNewHeadersBasedOnOutcome(outcomeType);
  const renderSortIcon = (sortMethod) =>
    sortMethod === 'asc' ? <IconSVG name="icon-caret-down" /> : <IconSVG name="icon-caret-up" />;
  return (
    <div
      className={classnames('grid grid-container', {
        classification: NUMBER_TYPES.indexOf(outcomeType) === -1,
      })}
    >
      <div className="grid-header">
        <div className="grid-row">
          <strong />
          {newHeaders.map((header) => {
            if (modelsSortColumn === header.property) {
              return (
                <strong
                  onClick={handleModelsSorting.bind(null, header.property)}
                  className="sortable-header"
                  key={header.property}
                >
                  <span>{header.label}</span>
                  {renderSortIcon(modelsSortMethod)}
                </strong>
              );
            }
            return (
              <strong key={header.property}>
                <span>{header.label}</span>
              </strong>
            );
          })}
          <strong />
        </div>
      </div>
      <div className="grid-body">
        {renderGridBody(
          models,
          outcomeType,
          experimentId,
          newlyTrainingModel,
          modelsLoading,
          modelsWithError
        )}
      </div>
    </div>
  );
}

function ModelsTableContent({
  experimentId,
  modelsList,
  loading,
  outcomeType,
  modelsTotalPages,
  modelsCurrentPage,
  modelsTotalCount,
  newlyTrainingModel,
  modelsSortColumn,
  modelsSortMethod,
  modelsLoading,
  modelsWithError,
}) {
  if (loading || isEmpty(experimentId)) {
    return <LoadingSVGCentered />;
  }
  return (
    <div className="experiment-models-table">
      <div className="experiment-table-header">
        <div className="btn-container">
          <Link
            className="btn btn-secondary"
            to={`/ns/${getCurrentNamespace()}/experiments/create?experimentId=${experimentId}&addModel=true`}
          >
            Add a Model
          </Link>
          <DeleteExperimentBtn experimentId={experimentId} />
        </div>
        <PaginationWithTitle
          handlePageChange={handleModelsPageChange}
          currentPage={modelsCurrentPage}
          totalPages={modelsTotalPages}
          title={T.translate(`${PREFIX}.models`, { context: modelsTotalCount })}
        />
      </div>
      <div className="grid-wrapper">
        {renderGrid(
          modelsList,
          outcomeType,
          experimentId,
          newlyTrainingModel,
          modelsSortColumn,
          modelsSortMethod,
          modelsLoading,
          modelsWithError
        )}
      </div>
    </div>
  );
}

ModelsTableContent.propTypes = {
  modelsList: PropTypes.array,
  loading: PropTypes.bool,
  experimentId: PropTypes.string,
  outcomeType: PropTypes.string,
  modelsTotalPages: PropTypes.number,
  modelsCurrentPage: PropTypes.number,
  modelsTotalCount: PropTypes.number,
  modelsSortMethod: PropTypes.string,
  modelsSortColumn: PropTypes.string,
  newlyTrainingModel: PropTypes.bool,
  modelsLoading: PropTypes.array,
  modelsWithError: PropTypes.array,
};

const mapStateToProps = (state) => {
  return {
    modelsList: state.models,
    experimentId: state.name,
    loading: state.loading,
    outcomeType: state.outcomeType,
    modelsTotalPages: state.modelsTotalPages,
    modelsCurrentPage:
      state.modelsOffset === 0 ? 1 : Math.ceil((state.modelsOffset + 1) / state.modelsLimit),
    modelsTotalCount: state.modelsTotalCount,
    newlyTrainingModel: state.newlyTrainingModel,
    modelsSortMethod: state.modelsSortMethod,
    modelsSortColumn: state.modelsSortColumn,
    modelsLoading: state.modelsLoading,
    modelsWithError: state.modelsWithError,
    error: state.error,
  };
};

function ModelsTable({ ...props }) {
  return (
    <div>
      {ModelsTableContent(props)}
      {props.error ? (
        <Alert
          message={props.error}
          type="error"
          showAlert={true}
          onClose={setExperimentDetailError}
        />
      ) : null}
    </div>
  );
}

ModelsTable.propTypes = {
  error: PropTypes.any,
};

const ModelsTableWrapper = connect(mapStateToProps)(ModelsTable);

export default ModelsTableWrapper;
