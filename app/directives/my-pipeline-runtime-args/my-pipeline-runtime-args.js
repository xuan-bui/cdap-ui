/*
 * Copyright © 2017 Cask Data, Inc.
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

class MyPipelineRuntimeArgsCtrl {
  constructor() {
    'ngInject';

    this.providedPopoverOpen = false;
    this.runtimeArguments = this.getRuntimeResolvedArguments(
      this.checkForReset(this.runtimeArguments)
    );
    this.onRuntimeArgumentsChange = this.onRuntimeArgumentsChange.bind(this);
    this.getResettedRuntimeArgument = this.getResettedRuntimeArgument.bind(this);
    this.checkForReset = this.checkForReset.bind(this);
  }

  getRuntimeResolvedArguments(runtimeArguments) {
    let runtimeArgumentsPairs = runtimeArguments.pairs;
    for (let i = 0; i < runtimeArgumentsPairs.length; i++) {
      if (runtimeArgumentsPairs[i].notDeletable) {
        if (runtimeArgumentsPairs[i].provided) {
          runtimeArgumentsPairs[i].showReset = false;
        } else {
          let runtimeArgKey = runtimeArgumentsPairs[i].key;
          if (this.resolvedMacros.hasOwnProperty(runtimeArgKey)) {
            if (this.resolvedMacros[runtimeArgKey] !== runtimeArgumentsPairs[i].value) {
              runtimeArgumentsPairs[i].value = this.resolvedMacros[runtimeArgKey];
            }
          }
        }
      }
    }
    return runtimeArguments;
  }

  onRuntimeArgumentsChange(changedArgs) {
    const newArgs = changedArgs.length ? changedArgs : [];
    this.runtimeArguments = this.checkForReset({pairs: newArgs});
  }

  getResettedRuntimeArgument(index) {
    let runtimeArgKey = this.runtimeArguments.pairs[index].key;
    this.runtimeArguments.pairs[index].value = this.resolvedMacros[runtimeArgKey];
    window.CaskCommon.KeyValueStore.dispatch({
      type: window.CaskCommon.KeyValueStoreActions.onUpdate,
      payload: {pairs: this.runtimeArguments.pairs}
    });
  }

  checkForReset(runtimeArguments) {
    let runtimeArgumentsPairs = runtimeArguments.pairs;
    runtimeArgumentsPairs.forEach(item => {
      if (item.notDeletable) {
        if (item.provided) {
          item.showReset = false;
        } else {
          let runtimeArgKey = item.key;
          if (this.resolvedMacros.hasOwnProperty(runtimeArgKey)) {
            if (this.resolvedMacros[runtimeArgKey] !== item.value) {
              item.showReset = true;
            } else {
              item.showReset = false;
            }
          }
        }
      }
    });
    return runtimeArguments;
  }
}

angular.module(PKG.name + '.commons')
  .controller('MyPipelineRuntimeArgsCtrl', MyPipelineRuntimeArgsCtrl);

angular.module(PKG.name + '.commons')
  .directive('myPipelineRuntimeArgs', function() {
    return {
      restrict: 'E',
      scope: {
        runtimeArguments: '=',
        containsMacros: '=',
        resolvedMacros: '='
      },
      replace: false,
      templateUrl: 'my-pipeline-runtime-args/my-pipeline-runtime-args.html',
      controller: 'MyPipelineRuntimeArgsCtrl',
      controllerAs: 'RuntimeArgsCtrl',
      bindToController: true
    };
  });
