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

import * as React from 'react';
import withStyles, { WithStyles, StyleRules } from '@material-ui/core/styles/withStyles';
import PluginConfigDisplay from 'components/Replicator/ConfigDisplay/PluginConfigDisplay';
import Heading, { HeadingTypes } from 'components/shared/Heading';
import { IPluginInfo, IPluginConfig } from 'components/Replicator/types';
import { IWidgetJson } from 'components/shared/ConfigurationGroup/types';

const styles = (theme): StyleRules => {
  return {
    container: {
      paddingTop: '15px',
      marginBottom: '40px',
      display: 'grid',
      gridTemplateColumns: '45% 45%',
      gridColumnGap: '10%',
    },
    sectionTitle: {
      marginBottom: '5px',
    },
    advanced: {
      marginBottom: '15px',
    },
    advancedLabel: {
      color: theme.palette.grey[100],
      marginRight: '10px',
    },
  };
};

interface IConfigDisplayProps extends WithStyles<typeof styles> {
  sourcePluginInfo: IPluginInfo;
  targetPluginInfo: IPluginInfo;
  sourcePluginWidget: IWidgetJson;
  targetPluginWidget: IWidgetJson;
  sourceConfig: IPluginConfig;
  targetConfig: IPluginConfig;
  numInstances: number;
}

const ConfigDisplayView: React.FC<IConfigDisplayProps> = ({
  classes,
  sourcePluginInfo,
  targetPluginInfo,
  sourcePluginWidget,
  targetPluginWidget,
  sourceConfig,
  targetConfig,
  numInstances,
}) => {
  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <div>
          <Heading type={HeadingTypes.h6} className={classes.sectionTitle} label="SOURCE" />
          <PluginConfigDisplay
            pluginInfo={sourcePluginInfo}
            pluginWidget={sourcePluginWidget}
            pluginConfig={sourceConfig}
          />
        </div>

        <div>
          <Heading type={HeadingTypes.h6} className={classes.sectionTitle} label="TARGET" />
          <PluginConfigDisplay
            pluginInfo={targetPluginInfo}
            pluginWidget={targetPluginWidget}
            pluginConfig={targetConfig}
          />
        </div>
      </div>

      <div className={classes.advanced}>
        <Heading type={HeadingTypes.h4} className={classes.sectionTitle} label="Advanced" />
        <div>
          <strong className={classes.advancedLabel}>Number of tasks:</strong>
          <span>{numInstances}</span>
        </div>
      </div>
    </div>
  );
};

const ConfigDisplay = withStyles(styles)(ConfigDisplayView);
export default ConfigDisplay;
