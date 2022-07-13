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

import { createStore } from 'redux';
import { defaultAction, composeEnhancers } from 'services/helpers';

export const CREATION_STEPS = {
  DATAPREP_CONNECTIONS: 'DATAPREP_CONNECTIONS',
  DATAPREP: 'DATAPREP',
  DATASPLIT: 'DATASPLIT',
  ALGORITHM_SELECTION: 'ALGORITHM_SELECTION',
};

const ACTIONS = {
  SET_EXPERIMENT_NAME: 'SET_EXPERIMENT_NAME',
  SET_EXPERIMENT_DESCRIPTION: 'SET_EXPERIMENT_DESCRIPTION',
  SET_EXPERIMENT_OUTCOME: 'SET_EXPERIMENT_OUTCOME',
  SET_EXPERIMENT_SRC_PATH: 'SET_EXPERIMENT_SRC_PATH',
  SET_CREATE_EXPERIMENT_LOADING: 'SET_CREATE_EXPERIMENT_LOADING',
  SET_EXPERIMENT_METADATA_FOR_EDIT: 'SET_EXPERIMENT_METADATA_FOR_EDIT',
  SET_VISIBLE_POPOVER: 'SET_VISIBLE_POPOVER',
  SET_EXPERIMENT_ERROR: 'SET_EXPERIMENT_ERROR',

  OVERRIDE_CREATION_STEP: 'OVERRIDE_CREATION_STEP',
  MODEL_UPDATE: 'MODEL_UPDATE',

  SET_SPLIT_INFO: 'SET_SPLIT_INFO',
  SET_SCHEMA: 'SET_SCHEMA',
  SET_OUTCOME_COLUMNS: 'SET_OUTCOME_COLUMNS',
  SET_DIRECTIVES: 'SET_DIRECTIVES',
  SET_MODEL_NAME: 'SET_MODEL_NAME',
  SET_MODEL_ID: 'SET_MODEL_ID',
  SET_EXPERIMENT_MODEL_FOR_EDIT: 'SET_EXPERIMENT_MODEL_FOR_EDIT',
  SET_MODEL_DESCRIPTION: 'SET_MODEL_DESCRIPTION',
  SET_MODEL_ML_ALGORITHM: 'SET_MODEL_ML_ALGORITHM',
  SET_VALID_ALGORITHMS_LIST: 'SET_VALID_ALGORITHMS_LIST',
  SET_ALGORITHMS_LIST: 'SET_ALGORITHMS_LIST',
  SET_WORKSPACE_ID: 'SET_WORKSPACE_ID',
  SET_SPLIT_FINALIZED: 'SET_SPLIT_FINALIZED',
  UPDATE_HYPER_PARAM: 'UPDATE_HYPER_PARAM',
  SET_MODEL_TRAINED: 'SET_MODEL_TRAINED',
  SET_MODEL_ERROR: 'SET_MODEL_ERROR',
  RESET: 'RESET',
};

const POPOVER_TYPES = {
  EXPERIMENT: 'EXPERIMENT',
  MODEL: 'MODEL',
};

const DEFAULT_EXPERIMENTS_CREATE_VALUE = {
  name: '',
  description: '',
  outcome: '',
  srcpath: '',
  loading: false,
  popover: POPOVER_TYPES.EXPERIMENT,
  isEdit: false,
  workspaceId: null,
  error: null,
};

const DEFAULT_MODEL_CREATE_VALUE = {
  name: '',
  description: '',
  modelId: null,

  directives: [],
  columns: [],
  schema: null,

  splitInfo: {},
  isSplitFinalized: false,

  algorithm: {
    name: '',
  },

  validAlgorithmsList: [],
  algorithmsList: [],
  isModelTrained: false,
  error: null,
};

const DEFAULT_ACTIVE_STEP = {
  override: false,
  step_name: CREATION_STEPS.DATAPREP_CONNECTIONS,
};

const experiments_create = (state = DEFAULT_EXPERIMENTS_CREATE_VALUE, action = defaultAction) => {
  switch (action.type) {
    case ACTIONS.SET_EXPERIMENT_NAME:
      return {
        ...state,
        name: action.payload.name,
      };
    case ACTIONS.SET_EXPERIMENT_DESCRIPTION:
      return {
        ...state,
        description: action.payload.description,
      };
    case ACTIONS.SET_EXPERIMENT_OUTCOME:
      return {
        ...state,
        outcome: action.payload.outcome,
      };
    case ACTIONS.SET_EXPERIMENT_SRC_PATH:
      return {
        ...state,
        srcpath: action.payload.srcpath,
      };
    case ACTIONS.SET_CREATE_EXPERIMENT_LOADING:
      return {
        ...state,
        loading: action.payload.loading,
      };
    case ACTIONS.SET_WORKSPACE_ID:
      return {
        ...state,
        workspaceId: action.payload.workspaceId,
      };
    case ACTIONS.SET_EXPERIMENT_METADATA_FOR_EDIT:
    case ACTIONS.SET_EXPERIMENT_MODEL_FOR_EDIT: {
      let { name, description, outcome, srcpath, workspaceId } = action.payload.experimentDetails;
      return {
        ...state,
        name,
        description,
        outcome,
        srcpath,
        workspaceId,
        isEdit: true,
        loading: false,
        popover: POPOVER_TYPES.MODEL,
      };
    }
    case ACTIONS.SET_VISIBLE_POPOVER:
      return {
        ...state,
        popover: action.payload.popover,
      };
    case ACTIONS.SET_EXPERIMENT_ERROR:
      return {
        ...state,
        error: action.payload.error,
      };
    case ACTIONS.RESET:
      return DEFAULT_EXPERIMENTS_CREATE_VALUE;
    default:
      return state;
  }
};

const model_create = (state = DEFAULT_MODEL_CREATE_VALUE, action = defaultAction) => {
  switch (action.type) {
    case ACTIONS.SET_MODEL_ID:
      return {
        ...state,
        modelId: action.payload.modelId,
      };
    case ACTIONS.SET_MODEL_NAME:
      return {
        ...state,
        name: action.payload.name,
      };
    case ACTIONS.SET_MODEL_DESCRIPTION:
      return {
        ...state,
        description: action.payload.description,
      };
    case ACTIONS.SET_SPLIT_INFO:
      return {
        ...state,
        splitInfo: action.payload.splitInfo,
      };
    case ACTIONS.MODEL_UPDATE:
      return {
        ...state,
        splitInfo: DEFAULT_MODEL_CREATE_VALUE.splitInfo,
      };
    case ACTIONS.SET_SPLIT_FINALIZED:
      return {
        ...state,
        isSplitFinalized: action.payload.isSplitFinalized,
      };
    case ACTIONS.SET_OUTCOME_COLUMNS:
      return {
        ...state,
        columns: action.payload.columns,
      };
    case ACTIONS.SET_DIRECTIVES:
      return {
        ...state,
        directives: action.payload.directives,
      };
    case ACTIONS.SET_MODEL_ML_ALGORITHM:
      return {
        ...state,
        algorithm: action.payload.algorithm,
      };
    case ACTIONS.SET_ALGORITHMS_LIST:
      return {
        ...state,
        algorithmsList: action.payload.algorithmsList,
      };
    case ACTIONS.UPDATE_HYPER_PARAM: {
      let { key, value } = action.payload;
      return {
        ...state,
        algorithm: {
          ...state.algorithm,
          hyperparameters: {
            ...state.algorithm.hyperparameters,
            [key]: value,
          },
        },
      };
    }
    case ACTIONS.SET_EXPERIMENT_METADATA_FOR_EDIT:
    case ACTIONS.SET_SCHEMA:
      return {
        ...state,
        schema: action.payload.schema || state.schema,
      };
    case ACTIONS.SET_EXPERIMENT_MODEL_FOR_EDIT: {
      let { name, description, id: modelId } = action.payload.modelDetails;
      return {
        ...state,
        name,
        description,
        modelId,
        splitInfo: action.payload.splitInfo,
      };
    }
    case ACTIONS.SET_VALID_ALGORITHMS_LIST:
      return {
        ...state,
        validAlgorithmsList: state.algorithmsList.filter(
          (algo) =>
            action.payload.validAlgorithmsList.map((al) => al.name).indexOf(algo.algorithm) !== -1
        ),
      };
    case ACTIONS.SET_MODEL_TRAINED:
      return {
        ...state,
        isModelTrained: true,
      };
    case ACTIONS.SET_MODEL_ERROR:
      return {
        ...state,
        error: action.payload.error,
      };
    case ACTIONS.RESET:
      return DEFAULT_MODEL_CREATE_VALUE;
    default:
      return state;
  }
};

const active_step = (state = DEFAULT_ACTIVE_STEP, action = defaultAction) => {
  const getActiveStep = (state) => {
    let { override } = state.active_step;
    if (override) {
      return state.active_step;
    }
    let { name, workspaceId } = state.experiments_create;
    let { modelId, isSplitFinalized, algorithm } = state.model_create;
    if (!workspaceId) {
      if (name) {
        return {
          ...state.active_step,
          step_name: CREATION_STEPS.DATAPREP,
        };
      }
      return {
        ...state.active_step,
        step_name: CREATION_STEPS.DATAPREP_CONNECTIONS,
      };
    }
    if (workspaceId && !modelId) {
      return {
        ...state.active_step,
        step_name: CREATION_STEPS.DATAPREP,
      };
    }

    if (modelId && !isSplitFinalized) {
      return {
        ...state.active_step,
        step_name: CREATION_STEPS.DATASPLIT,
      };
    }

    if (modelId && !algorithm.name.length) {
      return {
        ...state.active_step,
        step_name: CREATION_STEPS.ALGORITHM_SELECTION,
      };
    }
    return state.active_step;
  };
  switch (action.type) {
    case ACTIONS.SET_WORKSPACE_ID: {
      const newState = {
        ...state,
        experiments_create: {
          ...state.experiments_create,
          workspaceId: action.payload.workspaceId,
        },
        active_step: {
          ...state.active_step,
          step_name: state.active_step.step_name,
        },
      };
      return {
        ...state.active_step,
        step_name: getActiveStep(newState).step_name,
      };
    }
    case ACTIONS.MODEL_UPDATE: {
      const newState = {
        ...state,
        active_step: {
          override: false,
          step_name: state.active_step.step_name,
        },
      };
      return {
        override: false,
        step_name: getActiveStep(newState).step_name,
      };
    }
    case ACTIONS.OVERRIDE_CREATION_STEP:
      return {
        override: true,
        step_name: action.payload.active_step,
      };
    case ACTIONS.SET_SPLIT_FINALIZED: {
      let newState = {
        ...state,
        model_create: {
          ...state.model_create,
          isSplitFinalized: action.payload.isSplitFinalized,
        },
        active_step: {
          ...state.active_step,
          override: false,
        },
      };
      return getActiveStep(newState);
    }
    case ACTIONS.SET_EXPERIMENT_METADATA_FOR_EDIT: {
      let { name, description, outcome, srcpath, workspaceId } = action.payload.experimentDetails;
      const newState = {
        experiments_create: {
          ...state.experiments_create,
          name,
          description,
          outcome,
          srcpath,
          workspaceId,
        },
        model_create: state.model_create,
        active_step: state.active_step,
      };
      return getActiveStep(newState);
    }
    case ACTIONS.SET_EXPERIMENT_MODEL_FOR_EDIT: {
      let {
        name: experimentName,
        description: experimentDescription,
        outcome,
        srcpath,
        workspaceId,
      } = action.payload.experimentDetails;
      let {
        name: modelName,
        description: modelDescription,
        id: modelId,
      } = action.payload.modelDetails;
      const newState = {
        experiments_create: {
          ...state.experiments_create,
          name: experimentName,
          description: experimentDescription,
          outcome,
          srcpath,
          workspaceId,
        },
        model_create: {
          ...state.model_create,
          name: modelName,
          description: modelDescription,
          modelId,
        },
        active_step: state.active_step,
      };
      return getActiveStep(newState);
    }
    case ACTIONS.RESET:
      return DEFAULT_ACTIVE_STEP;
    default:
      return getActiveStep(state);
  }
};

const rootReducer = (state, action) => {
  return {
    experiments_create: experiments_create(state.experiments_create, action),
    model_create: model_create(state.model_create, action),
    active_step: active_step(state, action),
  };
};

const createExperimentStore = createStore(
  rootReducer,
  {
    experiments_create: DEFAULT_EXPERIMENTS_CREATE_VALUE,
    model_create: DEFAULT_MODEL_CREATE_VALUE,
    active_step: DEFAULT_ACTIVE_STEP,
  },
  composeEnhancers('CreateExperimentStore')()
);
const SPLIT_STATUS = {
  SPLITTING: 'Splitting',
  COMPLETE: 'Complete',
  FAILED: 'Failed',
  CREATING: 'CREATING', // Purely UI state. Used when UI calls backend to create a split.
};
export { ACTIONS, POPOVER_TYPES, SPLIT_STATUS };
export default createExperimentStore;
