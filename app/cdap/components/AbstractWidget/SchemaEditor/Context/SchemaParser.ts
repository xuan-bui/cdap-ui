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
import {
  ISchemaType,
  IDisplayType,
  IFieldType,
  IFieldTypeNullable,
  ILogicalTypeBase,
  IComplexType,
  IRecordField,
} from 'components/AbstractWidget/SchemaEditor/SchemaTypes';
import {
  getComplexTypeName,
  isNullable,
  isComplexType,
  getNonNullableType,
  getSimpleType,
} from 'components/AbstractWidget/SchemaEditor/SchemaHelpers';
import uuidV4 from 'uuid/v4';
import {
  InternalTypesEnum,
  defaultFieldType,
  AvroSchemaTypesEnum,
  getDefaultEmptyAvroSchema,
} from 'components/AbstractWidget/SchemaEditor/SchemaConstants';
import { objectQuery } from 'services/helpers';

type ITypeProperties = Record<string, any>;

/**
 * A generic node of the tree.
 * name, id, nullable and type - directly translate to the avro schema
 * children - is a map of child-id and the child node. In cases like records and enums
 * where the order of children needs to be maintained, the map will have a static
 * 'order' array.
 * internalType - purely used for presentation.
 * typeProperties - Defines the properties of the type. Right now this takes in
 * symbols in the enum and precision, scale in decimal types.
 */
interface INode {
  name?: string;
  children?: IOrderedChildren;
  id: string;
  internalType: InternalTypesEnum;
  nullable?: boolean;
  type?: IDisplayType;
  typeProperties?: ITypeProperties;
}

type IOrderedChildren = Record<string, INode> | Record<'order', string[]>;

/**
 * {
 *  [child-id1]: {
 *    id: child-id1,
 *    internalType: 'union-simple-type',
 *    type: 'string'
 *  }
 * }
 * @param type avro union type
 * ['string']
 */
function parseUnionType(type): IOrderedChildren {
  const result: IOrderedChildren = {
    order: [],
  };
  for (const subType of type) {
    const id = uuidV4();
    result.order.push(id);
    if (isComplexType(subType)) {
      const typeName = getComplexTypeName(subType);
      result[id] = {
        id,
        type: typeName,
        internalType: InternalTypesEnum.UNION_COMPLEX_TYPE_ROOT,
        children: parseComplexType(subType),
        ...getAdditionalTypeProperties(subType),
      };
    } else {
      result[id] = {
        id,
        type: getSimpleType(subType),
        nullable: false,
        internalType: InternalTypesEnum.UNION_SIMPLE_TYPE,
        ...getAdditionalTypeProperties({ type: subType }),
      };
    }
  }
  return result;
}
/**
 * @returns
 * {
 *  [child-id1]: {
 *    internalType: 'array-simple-type',
 *    type: 'string'
 *  }
 * }
 * @param type avro array type
 * {
 *  type: AvroSchemaTypesEnum.ARRAY,
 *  items: 'string'
 * }
 */
function parseArrayType(type): IOrderedChildren {
  const t = getNonNullableType(type);
  const nullable = isNullable(t.items);
  const id = uuidV4();
  if (t.items && !isComplexType(t.items)) {
    return {
      [id]: {
        internalType: InternalTypesEnum.ARRAY_SIMPLE_TYPE,
        id,
        nullable: isNullable(t.items),
        type: getSimpleType(getNonNullableType(t.items)),
        ...getAdditionalTypeProperties({ type: t.items }),
      },
    };
  }
  return {
    [id]: {
      internalType: InternalTypesEnum.ARRAY_COMPLEX_TYPE_ROOT,
      id,
      nullable,
      type: getComplexTypeName(t.items),
      children: parseComplexType(t.items),
      ...getAdditionalTypeProperties(t.items),
    },
  };
}

/**
 * @returns
 * {
 *  order: [child-id1, child-id2,...]
 *  [child-id1]: {
 *    id: child-id1,
 *    internalType: 'enum-symbol',
 *    typeProperties: {
 *      symbol: 'symbol1'
 *    }
 *  },
 *  [child-id2]: {
 *    id: child-id2,
 *    internalType: 'enum-symbol',
 *    typeProperties: {
 *      symbol: 'symbol2'
 *    }
 *  }
 * }
 * @param type avro enum type
 * {
 *  type: AvroSchemaTypesEnum.ENUM,
 *  symbols: ['symbol1', 'symbol2', ....]
 * }
 */
function parseEnumType(type): IOrderedChildren {
  const nullable = isNullable(type);
  const t = getNonNullableType(type);
  const result = {
    order: [],
  };
  for (const symbol of t.symbols) {
    const id = uuidV4();
    result.order.push(id);
    result[id] = {
      id,
      internalType: InternalTypesEnum.ENUM_SYMBOL,
      nullable,
      typeProperties: {
        symbol,
      },
    };
  }
  return result;
}

function getMapSubType(type, internalTypeName): INode {
  const id = uuidV4();
  if (!isComplexType(type)) {
    return {
      id,
      internalType: internalTypeName.simpleType,
      nullable: isNullable(type),
      type: getSimpleType(getNonNullableType(type)),
      ...getAdditionalTypeProperties({ type }),
    };
  } else {
    const complexType = getComplexTypeName(type);
    const nullable = isNullable(type);
    return {
      children: parseComplexType(type),
      id,
      internalType: internalTypeName.complexType,
      type: complexType,
      nullable,
      ...getAdditionalTypeProperties(type),
    };
  }
}
/**
 * @returns
 * {
 *   [child-id1]: {
 *    "id": child-id1,
 *    "internalType": "map-keys-simple-type",
 *    "type": "string"
 *  },
 *   [child-id2] {
 *    "id": child-id2,
 *    "internalType": "map-values-simple-type",
 *    "nullable": false,
 *    "type": "string"
 *   }
 * }
 * @param type avro map type
 * {
 *  type: {
 *    keys: 'string',
 *    values: 'string',
 *  }
 * }
 */
function parseMapType(type): IOrderedChildren {
  const t = getNonNullableType(type);
  const keysType = t.keys || 'string';
  const valuesType = t.values;
  const result: Record<string, INode> = {};
  const mapKeysSubType = getMapSubType(keysType, {
    simpleType: InternalTypesEnum.MAP_KEYS_SIMPLE_TYPE,
    complexType: InternalTypesEnum.MAP_KEYS_COMPLEX_TYPE_ROOT,
  });
  const mapValuesSubType = getMapSubType(valuesType, {
    simpleType: InternalTypesEnum.MAP_VALUES_SIMPLE_TYPE,
    complexType: InternalTypesEnum.MAP_VALUES_COMPLEX_TYPE_ROOT,
  });
  result[mapKeysSubType.id] = mapKeysSubType;
  result[mapValuesSubType.id] = mapValuesSubType;
  return result;
}
/**
 * @returns -
 * {
 *  [child-id1]:{
 *    id: child-id1,
 *    internalType: 'record-field-simple-type',
 *    type: 'string',
 *  },
 *  order: [child-id1]
 * }
 * @param type - avro record type
 * {
 *  name: 'record-name',
 *  type: 'record',
 *  fields: [ field1, field2 ...]
 * }
 */
function parseRecordType(type): IOrderedChildren {
  const t = getNonNullableType(type);
  const result = {
    order: [],
  };
  for (const field of t.fields) {
    const child = parseSubTree(field);
    result.order.push(child.id);
    result[child.id] = child;
  }
  if (!result.order.length) {
    const child = parseSubTree(defaultFieldType as IFieldType);
    result.order.push(child.id);
    result[child.id] = child;
  }
  return result;
}

function parseComplexType(type): IOrderedChildren {
  const complexTypeName = getComplexTypeName(type);
  let record: IOrderedChildren = {};
  switch (complexTypeName) {
    case AvroSchemaTypesEnum.ENUM:
      record = parseEnumType(type);
      break;
    case AvroSchemaTypesEnum.ARRAY:
      record = parseArrayType(type);
      break;
    case AvroSchemaTypesEnum.RECORD:
      record = parseRecordType(type);
      break;
    case AvroSchemaTypesEnum.UNION:
      record = parseUnionType(type);
      break;
    case AvroSchemaTypesEnum.MAP:
      record = parseMapType(type);
      break;
    default:
      record = {};
  }
  return record;
}

/**
 * The logical type is similar to a complex type. The only difference is it doesn't have
 *  children and will have type properties that map the logical property to underlying type.
 * @param field - field in the schema.
 */
function getAdditionalTypeProperties(field: Partial<IFieldType | IFieldTypeNullable>) {
  const fieldType = field.type;
  if (!fieldType) {
    return;
  }

  if (isComplexType(fieldType) && (fieldType as IComplexType).type === AvroSchemaTypesEnum.RECORD) {
    return {
      typeProperties: {
        doc: field.doc,
        aliases: field.aliases,
        typeName: fieldType && (fieldType as IRecordField).name,
      },
    };
  }

  const type = getNonNullableType(fieldType) as ILogicalTypeBase;
  if (!type) {
    return;
  }

  switch (type.logicalType) {
    case AvroSchemaTypesEnum.DECIMAL:
      return {
        typeProperties: {
          type: AvroSchemaTypesEnum.BYTES,
          logicalType: type.logicalType,
          precision: type.precision,
          scale: type.scale,
        },
      };
    case AvroSchemaTypesEnum.DATE:
      return {
        typeProperties: {
          type: AvroSchemaTypesEnum.INT,
          logicalType: type.logicalType,
        },
      };
    case AvroSchemaTypesEnum.DATETIME:
      return {
        typeProperties: {
          type: AvroSchemaTypesEnum.STRING,
          logicalType: type.logicalType,
        },
      };
    case AvroSchemaTypesEnum.TIMEMICROS:
      return {
        typeProperties: {
          type: AvroSchemaTypesEnum.LONG,
          logicalType: type.logicalType,
        },
      };
    case AvroSchemaTypesEnum.TIMESTAMPMICROS:
      return {
        typeProperties: {
          type: AvroSchemaTypesEnum.LONG,
          logicalType: type.logicalType,
        },
      };
    default:
      return {
        typeProperties: {
          doc: field.doc,
          aliases: field.aliases,
        },
      };
  }
}

/**
 * Function to parse fields in a record type. Can be a simple field or a complex record type.
 * @param field - A field in the record type.
 */
function parseSubTree(field: IFieldType | IFieldTypeNullable): INode {
  const { type, name } = field;
  const nullable = isNullable(type);
  const complexType = isComplexType(type);
  const t = getNonNullableType(type);
  if (!complexType) {
    return {
      name,
      id: uuidV4(),
      internalType: InternalTypesEnum.RECORD_SIMPLE_TYPE,
      nullable,
      type: getSimpleType(t),
      ...getAdditionalTypeProperties(field),
    };
  }
  return {
    name,
    children: parseComplexType(t),
    id: uuidV4(),
    internalType: InternalTypesEnum.RECORD_COMPLEX_TYPE_ROOT,
    nullable,
    type: getComplexTypeName(t),
    ...getAdditionalTypeProperties(field),
  };
}

/**
 * Parser to convert the avro schema JSON to internal representation of a tree.
 *
 * Each node has a type for display and an internal type to determine how rendering
 * happens. Based on the internal type presentation layer decides to nest/render rows.
 * @param avroSchema avro schema JSON
 * @param name default name of the schema.
 * @return The return is a tree. Will always be a schema type with record type. Can have deep nesting
 * depending upon the schema complexity.
 * {
 *  id: xxx,
 *  internalType: 'schema',
 *  type: 'record',
 *  children: {
 *    order: [array-of-child-ids],
 *    [child-id1]: child-id1 node,
 *    [child-id2]: child-id2 node,
 *  }
 * }
 */
function parseSchema(avroSchema: ISchemaType): INode {
  const name = avroSchema.name || 'etlSchemaBody';
  let fields = objectQuery(avroSchema, 'schema', 'fields');
  if (!fields) {
    fields = getDefaultEmptyAvroSchema().schema.fields;
  }
  const root: INode = {
    name,
    internalType: InternalTypesEnum.SCHEMA, // The 'schema' is only used for top level schema.
    type: AvroSchemaTypesEnum.RECORD,
    id: uuidV4(),
    children: {
      order: [],
    } as IOrderedChildren,
  };
  for (const field of fields) {
    const child = parseSubTree(field);
    if (Array.isArray(root.children.order)) {
      root.children.order.push(child.id);
    }
    root.children[child.id] = child;
  }
  return root;
}

export {
  parseSchema,
  INode,
  ITypeProperties,
  IOrderedChildren,
  parseComplexType,
  parseUnionType,
  parseArrayType,
  parseEnumType,
  parseMapType,
  getAdditionalTypeProperties,
};
