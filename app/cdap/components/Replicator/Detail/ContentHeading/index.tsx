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

import React, { useState, useContext } from 'react';
import withStyles, { WithStyles, StyleRules } from '@material-ui/core/styles/withStyles';
import { DetailContext } from 'components/Replicator/Detail';
import { objectQuery } from 'services/helpers';
import ConfigDisplay from 'components/Replicator/ConfigDisplay';
import If from 'components/shared/If';
import RunInfo from 'components/Replicator/Detail/ContentHeading/RunInfo';

const styles = (theme): StyleRules => {
  return {
    root: {
      '& > hr': {
        borderWidth: '4px',
        borderColor: theme.palette.grey[500],
        marginLeft: '-40px',
        marginRight: '-40px',
      },
    },
    contentHeading: {
      display: 'grid',
      gridTemplateColumns: '1fr 550px',
      marginTop: '15px',
      alignItems: 'center',
    },
    text: {
      display: 'inline-block',
      marginBottom: 0,
    },
    expandBtn: {
      color: theme.palette.blue[100],
      cursor: 'pointer',
      marginLeft: '15px',
      userSelect: 'none',

      '&:hover': {
        textDecoration: 'underline',
      },
    },
    noMargin: {
      marginTop: 0,
      marginBottom: 0,
    },
    heading: {
      display: 'flex',
      alignItems: 'center',
    },
    sourceTargetInfo: {
      display: 'flex',
      fontSize: '16px',

      '& > div': {
        marginRight: '50px',

        '&:last-child': {
          marginRight: '15px',
        },
      },
    },
    pluginType: {
      fontWeight: 500,
      color: theme.palette.grey[200],
    },
  };
};

function getDisplayName(pluginWidget, pluginInfo) {
  return objectQuery(pluginWidget, 'display-name') || objectQuery(pluginInfo, 'name');
}

const ContentHeadingView: React.FC<WithStyles<typeof styles>> = ({ classes }) => {
  const {
    sourcePluginInfo,
    sourcePluginWidget,
    sourceConfig,
    targetPluginInfo,
    targetPluginWidget,
    targetConfig,
    numInstances,
  } = useContext(DetailContext);

  const [configExpanded, setConfigExpanded] = useState(false);

  const sourceName = getDisplayName(sourcePluginWidget, sourcePluginInfo);
  const targetName = getDisplayName(targetPluginWidget, targetPluginInfo);

  return (
    <div className={classes.root}>
      <hr className={classes.noMargin} />
      <div className={classes.contentHeading}>
        <div className={classes.heading}>
          <div className={classes.sourceTargetInfo}>
            <div>
              <div className={classes.pluginType}>Source</div>
              <div>{sourceName}</div>
            </div>

            <div>
              <div className={classes.pluginType}>Target</div>
              <div>{targetName}</div>
            </div>
          </div>

          <span className={classes.expandBtn} onClick={() => setConfigExpanded(!configExpanded)}>
            {configExpanded ? 'Hide details' : 'View details'}
          </span>
        </div>
        <RunInfo />
      </div>
      <hr />

      <If condition={configExpanded}>
        <ConfigDisplay
          sourcePluginInfo={sourcePluginInfo}
          targetPluginInfo={targetPluginInfo}
          sourcePluginWidget={sourcePluginWidget}
          targetPluginWidget={targetPluginWidget}
          sourceConfig={sourceConfig}
          targetConfig={targetConfig}
          numInstances={numInstances}
        />
        <hr />
      </If>
    </div>
  );
};

const ContentHeading = withStyles(styles)(ContentHeadingView);
export default ContentHeading;
