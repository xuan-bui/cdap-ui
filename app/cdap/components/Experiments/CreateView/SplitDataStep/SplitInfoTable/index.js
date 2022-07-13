/*
 * Copyright © 2018 Cask Data, Inc.
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
import React, { Component } from 'react';
import IconSVG from 'components/shared/IconSVG';
import { Input } from 'reactstrap';
import { NUMBER_TYPES } from 'services/global-constants';
import SortableTable from 'components/shared/SortableTable';
import { objectQuery, roundDecimalToNDigits } from 'services/helpers';
import findLast from 'lodash/findLast';
import classnames from 'classnames';
import T from 'i18n-react';

const PREFIX = 'features.Experiments.CreateView.SplitInfo';

require('./SplitInfoTable.scss');

export default class SplitInfoTable extends Component {
  static propTypes = {
    splitInfo: PropTypes.object,
    onActiveColumnChange: PropTypes.func,
    activeColumn: PropTypes.string,
    outcome: PropTypes.string,
  };

  state = {
    collapsed: false,
    splitInfo: this.props.splitInfo,
    search: '',
    selectedTypes: ['boolean', 'double', 'float', 'int', 'long', 'string'],
    activeColumn: this.props.activeColumn,
    outcome: this.props.outcome,
  };

  componentWillReceiveProps(nextProps) {
    this.setState({
      splitInfo: nextProps.splitInfo,
      activeColumn: nextProps.activeColumn,
      outcome: nextProps.outcome,
    });
  }

  toggleCollapse = () => {
    this.setState({ collapsed: !this.state.collapsed });
  };

  isFieldNumberType = (type) => NUMBER_TYPES.indexOf(type) !== -1;

  CATEGORICAL_FIELD_HEADERS = [
    {
      property: 'name',
      label: T.translate(`${PREFIX}.columnName`),
    },
    {
      property: 'numTotal',
      label: T.translate(`${PREFIX}.count`),
    },
    {
      property: 'numEmpty',
      label: T.translate(`${PREFIX}.missing`),
    },
    {
      property: 'unique',
      label: T.translate(`${PREFIX}.unique`),
    },
  ];

  NUMERICAL_FIELD_HEADERS = [
    {
      property: 'name',
      label: T.translate(`${PREFIX}.columnName`),
    },
    {
      property: 'numTotal',
      label: T.translate(`${PREFIX}.count`),
    },
    {
      property: 'numEmpty',
      label: T.translate(`${PREFIX}.missing`),
    },
    {
      property: 'numZero',
      label: T.translate(`${PREFIX}.zero`),
    },
    {
      property: 'mean',
      label: T.translate(`${PREFIX}.mean`),
    },
    {
      property: 'stddev',
      label: T.translate(`${PREFIX}.stddev`),
    },
    {
      property: 'min',
      label: T.translate(`${PREFIX}.min`),
    },
    {
      property: 'max',
      label: T.translate(`${PREFIX}.max`),
    },
  ];

  onSearch = (e) => {
    this.setState({ search: e.target.value });
  };

  onToggleSelectedType = (e) => {
    if (this.state.selectedTypes.indexOf(e.target.name) !== -1) {
      this.setState({
        selectedTypes: this.state.selectedTypes.filter((type) => type !== e.target.name),
      });
    } else {
      this.setState({
        selectedTypes: [...this.state.selectedTypes, e.target.name],
      });
    }
  };

  renderNumericalTableBody = (fields) => {
    return (
      <tbody>
        {fields.map((field) => {
          return (
            <tr
              key={field.name}
              className={classnames({
                active: field.name === this.state.activeColumn,
              })}
              onClick={this.props.onActiveColumnChange.bind(null, field.name)}
            >
              <td>
                {this.state.outcome === field.name ? (
                  <span className="outcome-field">
                    <IconSVG name="icon-star" />
                    <span> {field.name} </span>
                  </span>
                ) : (
                  field.name
                )}
              </td>
              <td>{field.numTotal}</td>
              <td>{field.numEmpty}</td>
              <td>{field.numZero}</td>
              <td>{roundDecimalToNDigits(field.mean, 4)}</td>
              <td>{roundDecimalToNDigits(field.stddev, 4)}</td>
              <td>{field.min}</td>
              <td>{field.max}</td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  renderCategoricalTableBody = (fields) => {
    return (
      <tbody>
        {fields.map((field) => {
          return (
            <tr
              key={field.name}
              className={classnames({
                active: field.name === this.state.activeColumn,
              })}
              onClick={this.props.onActiveColumnChange.bind(null, field.name)}
            >
              <td>
                {this.state.outcome === field.name ? (
                  <span className="outcome-field">
                    <IconSVG name="icon-star" />
                    <span> {field.name} </span>
                  </span>
                ) : (
                  field.name
                )}
              </td>
              <td>{field.numTotal}</td>
              <td>{field.numEmpty}</td>
              <td>{field.unique}</td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  renderNumericalTable = (fields) => {
    return (
      <SortableTable
        entities={fields}
        tableHeaders={this.NUMERICAL_FIELD_HEADERS}
        renderTableBody={this.renderNumericalTableBody}
        sortOnInitialLoad={false}
      />
    );
  };

  renderCategoricalTable = (fields) => {
    return (
      <SortableTable
        entities={fields}
        tableHeaders={this.CATEGORICAL_FIELD_HEADERS}
        renderTableBody={this.renderCategoricalTableBody}
        sortOnInitialLoad={false}
      />
    );
  };

  renderTable = () => {
    if (!objectQuery(this.state.splitInfo, 'schema', 'fields', 'length')) {
      return null;
    }
    const schema = this.state.splitInfo.schema;
    const getFieldType = (field) => {
      let type;
      // TODO: The assumption fields cannot have complex type coming from dataprep wrangler
      // Need to verify this.
      if (Array.isArray(field.type)) {
        type = field.type.filter((t) => t !== 'null').pop();
      } else if (typeof field.type === 'string') {
        type = field.type;
      }
      return type;
    };
    const getStats = ({ name: fieldName }) => {
      let stat = findLast(this.state.splitInfo.stats, (stat) => stat.field === fieldName);
      stat = {
        numTotal: objectQuery(stat, 'numTotal', 'total') || '--',
        numNull: objectQuery(stat, 'numNull', 'total') || '--',
        numEmpty: objectQuery(stat, 'numEmpty', 'total') || '--',
        unique: objectQuery(stat, 'unique', 'total') || '--',
        numZero: objectQuery(stat, 'numZero', 'total') || '--',
        numPositive: objectQuery(stat, 'numPositive', 'total') || '--',
        numNegative: objectQuery(stat, 'numNegative', 'total') || '--',
        min: objectQuery(stat, 'min', 'total') || '--',
        max: objectQuery(stat, 'max', 'total') || '--',
        stddev: objectQuery(stat, 'stddev', 'total') || '--',
        mean: objectQuery(stat, 'mean', 'total') || '--',
      };
      return {
        name: fieldName,
        ...stat,
      };
    };
    const searchMatchFilter = (field) => {
      if (this.state.search.length) {
        return field.name.indexOf(this.state.search) !== -1 ? true : false;
      }
      return field;
    };
    const typeMatchFilter = (field) => this.state.selectedTypes.indexOf(getFieldType(field)) !== -1;
    const categoricalFields = schema.fields
      .filter(
        (field) =>
          typeMatchFilter(field) &&
          searchMatchFilter(field) &&
          !this.isFieldNumberType(getFieldType(field))
      )
      .map(getStats.bind(this));
    const numericalFields = schema.fields
      .filter(
        (field) =>
          typeMatchFilter(field) &&
          searchMatchFilter(field) &&
          this.isFieldNumberType(getFieldType(field))
      )
      .map(getStats.bind(this));
    const countOfType = (type) =>
      schema.fields.filter((field) => getFieldType(field) === type).length;
    return (
      <div className="split-info-table-container">
        <div className="split-table-search">
          <div className="filter-container">
            <span>{T.translate(`${PREFIX}.dataType`)}</span>
            <span>
              <Input
                type="checkbox"
                checked={this.state.selectedTypes.indexOf('boolean') !== -1}
                onChange={this.onToggleSelectedType}
                name="boolean"
              />
              <span> Boolean ({countOfType('boolean')}) </span>
            </span>
            <span>
              <Input
                type="checkbox"
                checked={this.state.selectedTypes.indexOf('double') !== -1}
                onChange={this.onToggleSelectedType}
                name="double"
              />
              <span> Double ({countOfType('double')}) </span>
            </span>
            <span>
              <Input
                type="checkbox"
                checked={this.state.selectedTypes.indexOf('float') !== -1}
                onChange={this.onToggleSelectedType}
                name="float"
              />
              <span> Float ({countOfType('float')}) </span>
            </span>
            <span>
              <Input
                type="checkbox"
                checked={this.state.selectedTypes.indexOf('int') !== -1}
                onChange={this.onToggleSelectedType}
                name="int"
              />
              <span> Integer ({countOfType('int')}) </span>
            </span>
            <span>
              <Input
                type="checkbox"
                checked={this.state.selectedTypes.indexOf('long') !== -1}
                onChange={this.onToggleSelectedType}
                name="long"
              />
              <span> Long ({countOfType('long')}) </span>
            </span>
            <span>
              <Input
                type="checkbox"
                checked={this.state.selectedTypes.indexOf('string') !== -1}
                onChange={this.onToggleSelectedType}
                name="string"
              />
              <span> String ({countOfType('string')}) </span>
            </span>
          </div>
          <Input
            className="table-field-search"
            placeholder={T.translate(`${PREFIX}.searchColumn`)}
            onChange={this.onSearch}
          />
        </div>
        <div className="split-info-numerical-table">
          <div className="split-table-header">{T.translate(`${PREFIX}.numerical`)}</div>
          {this.renderNumericalTable(numericalFields)}
        </div>
        <div className="split-info-categorical-table">
          <div className="split-table-header">{T.translate(`${PREFIX}.categorical`)}</div>
          {this.renderCategoricalTable(categoricalFields)}
        </div>
      </div>
    );
  };

  render() {
    return (
      <div className="split-info-table">
        <div className="split-info-collapsable-section" onClick={this.toggleCollapse}>
          {this.state.collapsed ? (
            <IconSVG name="icon-caret-right" />
          ) : (
            <IconSVG name="icon-caret-down" />
          )}
          <span> View Features </span>
        </div>
        {!this.state.collapsed ? (
          <div className="split-info-table-section">{this.renderTable()}</div>
        ) : null}
      </div>
    );
  }
}
