/*
 * Copyright © 2015 Cask Data, Inc.
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

angular.module(PKG.name + '.commons')
  .controller('MySidePanel', function ($scope, AvailablePluginsStore, $filter, myHelpers) {
    this.groups = $scope.panelGroups;
    this.groupGenericName = $scope.groupGenericName || 'group';
    this.itemGenericName = $scope.itemGenericName || 'item';

    let myRemoveCamelCase = $filter('myRemoveCamelcase');
    this.pluginsMap = {};

    this.view = $scope.view || 'icon';
    $scope.$watch('MySidePanel.groups.length', function() {

      if (this.groups.length) {
        this.openedGroup = this.groups[0].name;
      }
      /*
        42 = height of the each group's header
        (-42) = height of the current wrapper(group's) header height. We need to include that in the height of the group's wrapper.
        This is has to be through ng-style as the #of groups we might have could be dynamic and having to fit all in one specific
        height needs this calculation.

        FIXME: This will not scale i.e., non-reusable.

      */
      this.groupWrapperHeight = 'calc(100% - '+ (((this.groups.length * 35) - 35) - 1)+ 'px)';
    }.bind(this));

    this.onItemClicked = function(event, item) {
      event.stopPropagation();
      event.preventDefault();
      var fn = $scope.onPanelItemClick();
      if ('undefined' !== typeof fn) {
        fn.call($scope.onPanelItemClickContext, event, item);
      }
    };

    function generatePluginMapKey(plugin) {
      let {
        name,
        type,
        artifact
      } = plugin;

      if (plugin.pluginTemplate) {
        name = plugin.pluginName;
        type = plugin.pluginType;
      }

      return `${name}-${type}-${artifact.name}-${artifact.version}-${artifact.scope}`;
    }

    this.generateLabel = (plugin) => {
      if (plugin.pluginTemplate) {
        return plugin.name;
      }

      let key = generatePluginMapKey(plugin);

      let displayName = myHelpers.objectQuery(this.pluginsMap, key, 'widgets', 'display-name');

      displayName = displayName || myRemoveCamelCase(plugin.name);

      return displayName;
    };

    this.shouldShowCustomIcon = (plugin) => {
      let key = generatePluginMapKey(plugin);
      let iconSourceType = myHelpers.objectQuery(this.pluginsMap, key, 'widgets', 'icon', 'type');

      return ['inline', 'link'].indexOf(iconSourceType) !== -1;
    };

    this.getCustomIconSrc = (plugin) => {
      let key = generatePluginMapKey(plugin);
      let iconSourceType = myHelpers.objectQuery(this.pluginsMap, key, 'widgets', 'icon', 'type');

      if (iconSourceType === 'inline') {
        return myHelpers.objectQuery(this.pluginsMap, key, 'widgets', 'icon', 'arguments', 'data');
      }

      return myHelpers.objectQuery(this.pluginsMap, key, 'widgets', 'icon', 'arguments', 'url');
    };

    this.getFilteredPluginsFromGroup = (group) => {
      const trimmedSearchText = this.searchText ? this.searchText.trim().toLowerCase() : null;

      const containsTerm = (field, term) => {
        if (!field) {
          return false;
        }
        return field.toLowerCase().indexOf(term) > -1;
      };

      if (!trimmedSearchText || !trimmedSearchText.length) {
        return group.plugins;
      }

      return group.plugins.filter(plugin => {
        return containsTerm(plugin.name, trimmedSearchText) ||
          containsTerm(plugin.label, trimmedSearchText) ||
          containsTerm(this.generateLabel(plugin), trimmedSearchText);
      });
    };

    let sub = AvailablePluginsStore.subscribe(() => {
      this.pluginsMap = AvailablePluginsStore.getState().plugins.pluginsMap;
    });

    $scope.$on('$destroy', () => {
      sub();
    });

  });
