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
import IconSVG from 'components/shared/IconSVG';
import StatusMapper from 'services/StatusMapper';
import { PROGRAM_STATUSES } from 'services/global-constants';

const styles = (theme): StyleRules => {
  return {
    indicator: {
      marginRight: '5px',
    },
    blue: {
      color: theme.palette.blue[100],
    },
    green: {
      color: theme.palette.green[50],
    },
    red: {
      color: theme.palette.red[100],
    },
    grey: {
      color: theme.palette.grey[200],
    },
  };
};

interface IStatusIndicatorProps extends WithStyles<typeof styles> {
  status?: string;
  className?: string;
}

function findStatusIndicatorClass(status) {
  switch (status) {
    case PROGRAM_STATUSES.RUNNING:
    case PROGRAM_STATUSES.STARTING:
    case PROGRAM_STATUSES.PENDING:
      return 'blue';
    case PROGRAM_STATUSES.SUCCEEDED:
    case PROGRAM_STATUSES.COMPLETED:
    case PROGRAM_STATUSES.SCHEDULING:
    case PROGRAM_STATUSES.STOPPING:
      return 'green';
    case PROGRAM_STATUSES.FAILED:
    case PROGRAM_STATUSES.REJECTED:
      return 'red';
    default:
      return 'grey';
  }
}

const StatusIndicatorView: React.FC<IStatusIndicatorProps> = ({ classes, status, className }) => {
  const displayName = StatusMapper.lookupDisplayStatus(status);
  const statusIndicator = findStatusIndicatorClass(status);

  return (
    <IconSVG
      className={`${classes[statusIndicator]} ${className}`}
      name={StatusMapper.getStatusIndicatorIcon(displayName)}
    />
  );
};

const StatusIndicator = withStyles(styles)(StatusIndicatorView);
export default StatusIndicator;
