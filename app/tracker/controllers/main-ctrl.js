/*
 * Copyright © 2016 Cask Data, Inc.
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

class TrackerMainController {
  constructor($state, $scope, myTrackerApi, caskFocusManager) {
    this.$state = $state;
    this.$scope = $scope;
    this.searchQuery = '';
    this.myTrackerApi = myTrackerApi;
    caskFocusManager.focus('searchField');
  }

  search(event) {
    if (event.keyCode === 13 && this.searchQuery) {
      this.$state.go('tracker.detail.result', { searchQuery: this.searchQuery });
    }
  }
}

angular.module(PKG.name + '.feature.tracker')
  .controller('TrackerMainController', TrackerMainController);
