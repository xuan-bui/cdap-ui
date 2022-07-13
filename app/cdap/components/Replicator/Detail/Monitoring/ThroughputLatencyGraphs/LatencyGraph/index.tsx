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

import React from 'react';
import withStyles, { WithStyles, StyleRules } from '@material-ui/core/styles/withStyles';
import Heading, { HeadingTypes } from 'components/shared/Heading';
import {
  COLOR_MAP,
  renderLatencyGraph,
} from 'components/Replicator/Detail/Monitoring/ThroughputLatencyGraphs/LatencyGraph/latency';
import { IThroughputLatencyData } from 'components/Replicator/Detail/Monitoring/ThroughputLatencyGraphs/parser';
import ChartContainer from 'components/shared/ChartContainer';
import ChartTableSwitcher from 'components/Replicator/Detail/ChartTableSwitcher';
import LatencyTable from 'components/Replicator/Detail/Monitoring/ThroughputLatencyGraphs/LatencyGraph/LatencyTable';
import LatencyTooltip from 'components/Replicator/Detail/Monitoring/ThroughputLatencyGraphs/LatencyGraph/LatencyTooltip';

const styles = (): StyleRules => {
  return {
    root: {
      position: 'relative',
    },
    heading: {
      marginBottom: '10px',
    },
    latency: {
      height: '4px',
      width: '30px',
      display: 'inline-block',
      marginRight: '7px',
      backgroundColor: COLOR_MAP.line,
    },
    bottomLegend: {
      marginTop: '25px',
      padding: '0 50px',
    },
  };
};

interface ILatencyGraphProps extends WithStyles<typeof styles> {
  data: IThroughputLatencyData[];
}

const CONTAINER_ID = 'replication-latency-graph';

const LatencyGraphView: React.FC<ILatencyGraphProps> = ({ classes, data }) => {
  function renderTooltip(tooltip) {
    return <LatencyTooltip tooltip={tooltip} />;
  }

  const chart = (
    <React.Fragment>
      <ChartContainer
        containerId={CONTAINER_ID}
        data={data}
        chartRenderer={renderLatencyGraph}
        watchWidth={true}
        renderTooltip={renderTooltip}
      />
      <div className={classes.bottomLegend}>
        <div>
          <div className={classes.latency} />
          <span>Average Latency</span>
        </div>
      </div>
    </React.Fragment>
  );

  const table = <LatencyTable data={data} />;

  return (
    <div className={classes.root}>
      <Heading type={HeadingTypes.h4} label="Latency" className={classes.heading} />
      <ChartTableSwitcher chart={chart} table={table} />
    </div>
  );
};

const LatencyGraph = withStyles(styles)(LatencyGraphView);
export default LatencyGraph;
