import { IStageSchema, IWidgetProps } from 'components/AbstractWidget';
import React, { useEffect, useState } from 'react';
import { WIDGET_PROPTYPES } from 'components/AbstractWidget/constants';
import withStyles, { StyleRules, WithStyles } from '@material-ui/core/styles/withStyles';
import ThemeWrapper from 'components/ThemeWrapper';
import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Input,
  MenuItem,
  Select,
} from '@material-ui/core';
import { objectQuery } from 'services/helpers';
import { IField } from 'components/FieldLevelLineage/v2/Context/FllContextHelper';
import DataMappingWidget from '../DataMappingWidget';
import DeleteIcon from '@material-ui/icons/Delete';
import cloneDeep from 'lodash/cloneDeep';

const styles = (theme): StyleRules => {
  return {
    container: {
      display: 'grid',
      gridTemplateColumns: '50% 50%',
      gridGap: '10px',
    },
    title: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
    },
    propertyContainer: {
      padding: '15px',
      marginBottom: '15px',
      boxShadow:
        '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
    },
    input: {
      width: '100%',
    },
  };
};

interface IGraphDataEditorWidgetProps extends IWidgetProps<any>, WithStyles<typeof styles> {
  graphManagementApi?: string;
  value: string;
}

const GraphListProperties = ({ type, data, vertexs, edges, inputSchema, classes, onChange }) => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    setProperties(data);
  }, [data]);

  const addProperties = () => {
    const data = [
      ...properties,
      {
        label: '',
        id: '',
        hardCodedLabel: true,
        fromLabel: '',
        toLabel: '',
        properties: [],
      },
    ];
    setProperties(data);
    onChange(data);
  };

  const handleChangeItem = (value, index) => {
    const data = [...properties];
    data.splice(index, 1, value);
    setProperties(data);
    onChange(data);
  };

  const handleDeleteItem = (index) => {
    const data = [...properties];
    data.splice(index, 1);
    setProperties(data);
    onChange(data);
  };

  return (
    <div>
      <div className={classes.title}>
        <div>
          <b>{type === 'vertex' ? 'Vertex Mapping' : 'Edge Mapping'}</b>
        </div>
        <Button variant="contained" color="primary" onClick={() => addProperties()}>
          Add
        </Button>
      </div>
      <div>
        {type === 'vertex'
          ? properties.map((property, index) => (
              <GraphVertex
                property={property}
                changeItem={(value) => handleChangeItem(value, index)}
                deleteItem={() => handleDeleteItem(index)}
                vertexs={vertexs}
                inputSchema={inputSchema}
                classes={classes}
              />
            ))
          : properties.map((property, index) => (
              <GraphEdge
                property={property}
                changeItem={(value) => handleChangeItem(value, index)}
                deleteItem={() => handleDeleteItem(index)}
                vertexs={vertexs}
                edges={edges}
                inputSchema={inputSchema}
                classes={classes}
              />
            ))}
      </div>
    </div>
  );
};

const GraphVertex = ({ property, classes, vertexs, inputSchema, changeItem, deleteItem }) => {
  const [item, setItem] = useState({
    label: '',
    id: '',
    hardCodedLabel: true,
    fromLabel: '',
    toLabel: '',
    properties: [],
  });
  const [availableProperties, setAvailableProperties] = useState([]);

  useEffect(() => {
    const item = {
      ...property,
    };
    setItem(item);
  }, [property]);

  const handleChangeItem = (field, value) => {
    const data = {
      ...item,
      [field]: value,
    };
    if (field === 'label' || field === 'hardCodedLabel') {
      data.properties = [];
    }
    setItem(data);
    changeItem(data);

    if (field === 'label' && value) {
      const vertex = vertexs.find((i) => i.value === value);

      if (vertex) {
        setAvailableProperties(vertex.properties);
      }
    }
  };

  const handleChangeProperties = (value) => {
    handleChangeItem('properties', value);
  };

  return (
    <div className={classes.propertyContainer}>
      <div className={classes.title}>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={item.hardCodedLabel}
                onChange={(event) => handleChangeItem('hardCodedLabel', event.target.checked)}
              />
            }
            label="Is hardcoded label?"
          />
        </FormGroup>
        <IconButton color="secondary" onClick={deleteItem} data-cy="remove-row">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </div>
      <div className={classes.formGroup}>
        <label className={classes.label}>Vertex</label>
        {item.hardCodedLabel ? (
          <Input
            className={classes.input}
            placeholder="Vertex Label"
            onChange={(event) => handleChangeItem('label', event.target.value)}
            value={item.label}
          />
        ) : (
          <Select
            className={classes.input}
            value={item.label}
            onChange={(event) => handleChangeItem('label', event.target.value)}
          >
            {vertexs.map((option) => {
              return (
                <MenuItem value={option.value} key={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        )}
      </div>
      <div className={classes.formGroup}>
        <label className={classes.label}>ID</label>
        <Select
          className={classes.input}
          value={item.id}
          onChange={(event) => handleChangeItem('id', event.target.value)}
        >
          {inputSchema.map((option) => {
            return (
              <MenuItem value={option} key={option}>
                {option}
              </MenuItem>
            );
          })}
        </Select>
      </div>
      <div className={classes.formGroup}>
        <label className={classes.label}>Properties</label>
        <DataMappingWidget
          value={item.properties}
          inputDropdownOptions={inputSchema}
          outputDropdownOptions={availableProperties}
          hasOutput={!item.hardCodedLabel}
          onChange={handleChangeProperties}
        />
      </div>
    </div>
  );
};

const GraphEdge = ({ property, classes, vertexs, edges, inputSchema, changeItem, deleteItem }) => {
  const [item, setItem] = useState({
    label: '',
    id: '',
    hardCodedLabel: true,
    fromLabel: '',
    toLabel: '',
    properties: [],
  });
  const [availableProperties, setAvailableProperties] = useState([]);

  useEffect(() => {
    const item = {
      ...property,
    };
    setItem(item);
  }, [property]);

  const handleChangeItem = (field, value) => {
    const data = {
      ...item,
      [field]: value,
    };
    setItem(data);
    changeItem(data);

    if (field === 'label' && value) {
      const edge = edges.find((i) => i.value === value);

      if (edge) {
        setAvailableProperties(edge.properties);
      }
    }
  };

  const handleChangeProperties = (value) => {
    handleChangeItem('properties', value);
  };

  return (
    <div className={classes.propertyContainer}>
      <div className={classes.title}>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={item.hardCodedLabel}
                onChange={(event) => handleChangeItem('hardCodedLabel', event.target.checked)}
              />
            }
            label="Is hardcoded label?"
          />
        </FormGroup>
        <IconButton color="secondary" onClick={deleteItem} data-cy="remove-row">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </div>
      <div className={classes.formGroup}>
        <label className={classes.label}>Edge</label>
        {item.hardCodedLabel ? (
          <Input
            className={classes.input}
            placeholder="Edge Label"
            onChange={(event) => handleChangeItem('label', event.target.value)}
            value={item.label}
          />
        ) : (
          <Select
            className={classes.input}
            value={item.label}
            onChange={(event) => handleChangeItem('label', event.target.value)}
          >
            {edges.map((option) => {
              return (
                <MenuItem value={option.value} key={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        )}
      </div>
      <div className={classes.formGroup}>
        <label className={classes.label}>ID</label>
        <Select
          className={classes.input}
          value={item.id}
          onChange={(event) => handleChangeItem('id', event.target.value)}
        >
          {inputSchema.map((option) => {
            return (
              <MenuItem value={option} key={option}>
                {option}
              </MenuItem>
            );
          })}
        </Select>
      </div>
      <div className={classes.formGroup}>
        <label className={classes.label}>From Vertex</label>
        {item.hardCodedLabel ? (
          <Input
            className={classes.input}
            placeholder="From Vertex"
            onChange={(event) => handleChangeItem('fromLabel', event.target.value)}
            value={item.fromLabel}
          />
        ) : (
          <Select
            className={classes.input}
            value={item.fromLabel}
            onChange={(event) => handleChangeItem('fromLabel', event.target.value)}
          >
            {vertexs.map((option) => {
              return (
                <MenuItem value={option.value} key={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        )}
      </div>
      <div className={classes.formGroup}>
        <label className={classes.label}>To Vertex</label>
        {item.hardCodedLabel ? (
          <Input
            className={classes.input}
            placeholder="From Vertex"
            onChange={(event) => handleChangeItem('toLabel', event.target.value)}
            value={item.toLabel}
          />
        ) : (
          <Select
            className={classes.input}
            value={item.toLabel}
            onChange={(event) => handleChangeItem('toLabel', event.target.value)}
          >
            {vertexs.map((option) => {
              return (
                <MenuItem value={option.value} key={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        )}
      </div>
      <div className={classes.formGroup}>
        <label className={classes.label}>Properties</label>
        <DataMappingWidget
          value={item.properties}
          inputDropdownOptions={inputSchema}
          outputDropdownOptions={availableProperties}
          hasOutput={!item.hardCodedLabel}
          onChange={handleChangeProperties}
        />
      </div>
    </div>
  );
};

const GraphDataEditorWidgetView: React.FC<IGraphDataEditorWidgetProps> = ({
  value,
  extraConfig,
  onChange,
  widgetProps,
  classes,
}) => {
  const [vertexOptions, setVertexOptions] = useState([]);
  const [edgeOptions, setEdgeOptions] = useState([]);
  const [listVertexs, setListVertexs] = useState([]);
  const [listEdges, setListEdges] = useState([]);
  const inputSchema = getFields(objectQuery(extraConfig, 'inputSchema') || []);

  useEffect(() => {
    fetchListAttributes();
    const data = JSON.parse(value);
    if (data) {
      setListVertexs(
        data.NODE_LIST?.map((i) => {
          const hardCodedLabel = i.hardCodedLabel || true;
          return {
            label: i.label || '',
            id: i.id || '',
            hardCodedLabel,
            fromLabel: i.fromLabel || '',
            toLabel: i.toLabel || '',
            properties:
              i.properties?.map((j) => ({
                key: hardCodedLabel ? j : j?.key || '',
                value: hardCodedLabel ? '' : j?.value || '',
              })) || [],
          };
        }) || []
      );
      setListEdges(
        data.EDGE_LIST?.map((i) => {
          const hardCodedLabel = i.hardCodedLabel || true;
          return {
            label: i.label || '',
            id: i.id || '',
            hardCodedLabel,
            fromLabel: i.fromLabel || '',
            toLabel: i.toLabel || '',
            properties:
              i.properties?.map((j) => ({
                key: hardCodedLabel ? j : j?.key || '',
                value: hardCodedLabel ? '' : j?.value || '',
              })) || [],
          };
        }) || []
      );
    }
  }, []);

  function getFields(schemas: IStageSchema[]) {
    let fields = [];
    if (!schemas || schemas.length === 0) {
      return fields;
    }
    const stage = schemas[0];

    try {
      const unparsedFields = JSON.parse(stage.schema).fields;

      if (unparsedFields.length > 0) {
        fields = unparsedFields.map((field: IField) => field.name);
      }
    } catch {
      // tslint:disable-next-line: no-console
      console.log('Error: Invalid JSON schema');
    }
    return fields;
  }

  const onChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const v = event.target.value;
    if (typeof onChange === 'function') {
      onChange(v);
    }
  };

  const fetchListAttributes = () => {
    fetch(widgetProps.graphManagementApi)
      .then((response) => response.json())
      .then((data) => {
        setVertexOptions(
          data.vertexlabels.map((i) => ({
            label: i.name,
            value: i.name,
            properties: i.properties || [],
          }))
        );
        setEdgeOptions(
          data.edgelabels.map((i) => ({
            label: i.name,
            value: i.name,
            properties: i.properties || [],
          }))
        );
      });
  };

  const handleChange = (type, list) => {
    const data = {
      NODE_LIST: cloneDeep(listVertexs),
      EDGE_LIST: cloneDeep(listEdges),
    };
    switch (type) {
      case 'vertex':
        setListVertexs(list);
        data.NODE_LIST = cloneDeep(list);
        break;
      case 'edge':
        setListEdges(list);
        data.EDGE_LIST = cloneDeep(list);
        break;
    }
    data.NODE_LIST.map((i) => {
      if (i.hardCodedLabel) {
        i.properties = i.properties.map((j) => j.key);
      }
      return i;
    });
    data.EDGE_LIST.map((i) => {
      if (i.hardCodedLabel) {
        i.properties = i.properties.map((j) => j.key);
      }
      return i;
    });
    onChange(JSON.stringify(data));
  };

  return (
    <div className={classes.container}>
      <GraphListProperties
        type="vertex"
        data={listVertexs}
        onChange={(data) => handleChange('vertex', data)}
        vertexs={vertexOptions}
        edges={edgeOptions}
        inputSchema={inputSchema}
        classes={classes}
      />
      <GraphListProperties
        type="edge"
        data={listEdges}
        onChange={(data) => handleChange('edge', data)}
        vertexs={vertexOptions}
        edges={edgeOptions}
        inputSchema={inputSchema}
        classes={classes}
      />
    </div>
  );
};

const StyledGraphDataEditorWidget = withStyles(styles)(GraphDataEditorWidgetView);

export default function GraphDataEditorWidget(props: IGraphDataEditorWidgetProps) {
  return (
    <ThemeWrapper>
      <StyledGraphDataEditorWidget {...props} />
    </ThemeWrapper>
  );
}

(GraphDataEditorWidget as any).propTypes = WIDGET_PROPTYPES;
(GraphDataEditorWidget as any).getWidgetAttributes = () => {
  return {
    graphManagementApi: { type: 'string', required: true },
  };
};
