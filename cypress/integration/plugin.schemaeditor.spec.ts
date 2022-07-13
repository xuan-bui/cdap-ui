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

import * as Helpers from '../helpers';
import { INodeInfo, INodeIdentifier } from '../typings';
import { ISchemaType } from '../../app/cdap/components/AbstractWidget/SchemaEditor/SchemaTypes';
let headers = {};
describe('Plugin Schema Editor', () => {
  // Uses API call to login instead of logging in manually through UI
  before(() => {
    Helpers.loginIfRequired().then(() => {
      cy.getCookie('CDAP_Auth_Token')
        .then((cookie) => {
          if (!cookie) {
            return;
          }
          headers = {
            Authorization: 'Bearer ' + cookie.value,
          };
          return Helpers.getSessionToken(headers);
        })
        .then(() => Helpers.getSessionToken(headers))
        .then(
          (sessionToken) =>
            (headers = Object.assign({}, headers, { 'Session-Token': sessionToken }))
        );
    });
    const stub = cy.stub();
    cy.window().then((win) => {
      win.onbeforeunload = null;
    });
    cy.on('window:confirm', stub);
  });

  const openProjectionTransform = () => {
    cy.visit('/pipelines/ns/default/studio');
    const projection: INodeInfo = { nodeName: 'Projection', nodeType: 'transform' };
    const projectionId: INodeIdentifier = { ...projection, nodeId: '0' };

    cy.open_transform_panel();
    cy.add_node_to_canvas(projection);

    return cy.open_node_property(projectionId);
  };
  const stripNameFromMap = (firstFieldType) => {
    if (firstFieldType.type === 'map') {
      if (typeof firstFieldType.keys === 'object') {
        delete firstFieldType.keys.name;
      }
      if (typeof firstFieldType.values === 'object') {
        delete firstFieldType.values.name;
      }
    }
    return firstFieldType;
  };
  const stripNameFromRecord = (firstFieldType) => {
    if (firstFieldType.type === 'record') {
      delete firstFieldType.name;
    }
    return firstFieldType;
  };
  const stripGeneratedName = (firstFieldType) => {
    if (Array.isArray(firstFieldType)) {
      firstFieldType = firstFieldType.map((t) => stripNameFromMap(stripNameFromRecord(t)));
    } else {
      firstFieldType = stripNameFromMap(stripNameFromRecord(firstFieldType));
    }
    return firstFieldType;
  };
  const checkForSchema = (fieldSchema, checkForAllFields = false) => {
    const onExportListener = (data) => {
      const etlSchema: ISchemaType = data[0];
      const schema = etlSchema.schema;
      if (checkForAllFields) {
        expect(schema.fields).to.deep.equal(fieldSchema);
        expect(schema.fields.length).equal(fieldSchema.length);
      } else {
        expect(schema.fields.length).equal(1);
        let firstFieldType = schema.fields[0].type;
        firstFieldType = stripGeneratedName(firstFieldType);
        expect(schema.fields[0].type).to.deep.equal(fieldSchema);
      }
      cy.off('schema.export', onExportListener);
    };
    cy.on('schema.export', onExportListener);
    cy.get('[data-cy="select-schema-actions-dropdown"] [role="button"]').click();
    cy.get('[data-cy="option-export"]').click();
  };
  const addField = (row, name, type = null) => {
    cy.get(`[data-cy="schema-row-${row}"] input[placeholder="Field name"]`)
      .type(name)
      .type('{enter}');
    return type ? cy.get(`[data-cy="schema-row-${row}"] select`).select(type) : cy.wrap(true);
  };
  const setFieldType = (row, type) => {
    cy.get(`[data-cy="schema-row-${row}"] select`).select(type);
  };
  const removeField = (row) => {
    return cy.get(`[data-cy="schema-row-${row}"] [data-cy="schema-field-remove-button"]`).click();
  };

  it('Should render default empty schema', () => {
    openProjectionTransform();
    cy.get(`[data-cy="schema-row-0"]`);
  });

  describe('Schema with simple types', () => {
    it('Should add simple type(boolean, bytes, double, float, int, long, string) fields', () => {
      openProjectionTransform();
      addField(0, 'Name');
      addField(1, 'Email');
      addField(2, 'phone', 'long');
      cy.get('[data-cy="schema-fields-list"]').then((el) => {
        expect(el[0].children.length).equal(4);
      });
      addField(3, 'intfield', 'int');
      addField(4, 'floatfield', 'float');
      addField(5, 'doublefield', 'double');
      addField(6, 'bytesfield', 'bytes');
      addField(7, 'booleanfield', 'boolean');

      checkForSchema(
        [
          {
            name: 'Name',
            type: 'string',
          },
          {
            name: 'Email',
            type: 'string',
          },
          {
            name: 'phone',
            type: 'long',
          },
          {
            name: 'intfield',
            type: 'int',
          },
          {
            name: 'floatfield',
            type: 'float',
          },
          {
            name: 'doublefield',
            type: 'double',
          },
          {
            name: 'bytesfield',
            type: 'bytes',
          },
          {
            name: 'booleanfield',
            type: 'boolean',
          },
        ],
        true
      );
    });

    it('Should delete existing simple type fields when clicking on delete button', () => {
      removeField(7);
      cy.get('[data-cy="schema-fields-list"]').then((el) => {
        expect(el[0].children.length).equal(8);
      });
      removeField(6);
      removeField(5);
      removeField(4);
      removeField(3);
      removeField(2);
      removeField(1);
      removeField(0);
      cy.get('[data-cy="schema-fields-list"]').then((el) => {
        expect(el[0].children.length).equal(1);
      });
    });

    it('Should add new field when clicking "+" button', () => {
      openProjectionTransform();
      addField(0, 'Name');
      removeField(1);
      cy.get(`[data-cy="schema-row-0"] [data-cy="schema-field-add-button"]`).click();
      addField(1, 'Email');
      removeField(2);
      cy.get('[data-cy="schema-fields-list"]').then((el) => {
        expect(el[0].children.length).equal(2);
      });
    });
  });

  describe('Schema with complex types', () => {
    describe('Schema with map type', () => {
      it('Should add map complex type', () => {
        openProjectionTransform();
        addField(0, 'Name', 'map');
        checkForSchema({
          type: 'map',
          keys: 'string',
          values: 'string',
        });
      });

      it('Should edit map types (keys) with simple type', () => {
        setFieldType(1, 'int');
        checkForSchema({
          type: 'map',
          keys: 'int',
          values: 'string',
        });
      });

      it('Should edit map type (keys) with complex type', () => {
        setFieldType(1, 'record');
        addField(2, 'field1');
        checkForSchema({
          type: 'map',
          keys: {
            type: 'record',
            fields: [
              {
                name: 'field1',
                type: 'string',
              },
            ],
          },
          values: 'string',
        });
      });

      it('Should edit map type (values) with simple type', () => {
        setFieldType(1, 'string');
        setFieldType(2, 'int');
        checkForSchema({
          type: 'map',
          keys: 'string',
          values: 'int',
        });
      });

      it('Should edit map type (values) with complex type', () => {
        setFieldType(1, 'string');
        setFieldType(2, 'record');
        addField(3, 'field1');
        checkForSchema({
          type: 'map',
          keys: 'string',
          values: {
            type: 'record',
            fields: [
              {
                name: 'field1',
                type: 'string',
              },
            ],
          },
        });
      });
    });

    describe('Schema with record type', () => {
      it('Should add record complex type', () => {
        openProjectionTransform();
        addField(0, 'Name', 'record');
        addField(1, 'field1');
        checkForSchema({
          type: 'record',
          name: 'Name',
          fields: [
            {
              name: 'field1',
              type: 'string',
            },
          ],
        });
      });

      it('Should edit record type with simple types (int)', () => {
        setFieldType(1, 'int');
        checkForSchema({
          type: 'record',
          name: 'Name',
          fields: [
            {
              name: 'field1',
              type: 'int',
            },
          ],
        });
      });

      it('Should edit record type with simple types (boolean)', () => {
        setFieldType(1, 'boolean');
        checkForSchema({
          type: 'record',
          name: 'Name',
          fields: [
            {
              name: 'field1',
              type: 'boolean',
            },
          ],
        });
      });

      it('Should edit record type with complex types (union)', () => {
        openProjectionTransform();
        addField(0, 'Name', 'record');
        addField(1, 'field1', 'union');
        cy.get(`[data-cy="schema-row-2"] [data-cy="schema-field-add-button"]`).click();
        setFieldType(3, 'int');
        checkForSchema({
          type: 'record',
          name: 'Name',
          fields: [
            {
              name: 'field1',
              type: ['string', 'int'],
            },
          ],
        });
      });

      it('Should edit record type with complex types (array)', () => {
        setFieldType(1, 'array');
        checkForSchema({
          type: 'record',
          name: 'Name',
          fields: [
            {
              name: 'field1',
              type: {
                type: 'array',
                items: 'string',
              },
            },
          ],
        });
      });
    });

    describe('Schema with array type', () => {
      it('Should add array complex type', () => {
        openProjectionTransform();
        addField(0, 'Name', 'array');
        checkForSchema({
          type: 'array',
          items: 'string',
        });
      });

      it('Should edit array type with simple type(bytes)', () => {
        openProjectionTransform();
        addField(0, 'Name', 'array');
        setFieldType(1, 'bytes');
        checkForSchema({
          type: 'array',
          items: 'bytes',
        });
      });

      it('Should edit array with simple type(float)', () => {
        setFieldType(1, 'float');
        checkForSchema({
          type: 'array',
          items: 'float',
        });
      });

      it('Should edit array with complex type(map)', () => {
        openProjectionTransform();
        addField(0, 'Name', 'array');
        setFieldType(1, 'map');
        checkForSchema({
          type: 'array',
          items: {
            type: 'map',
            keys: 'string',
            values: 'string',
          },
        });
      });

      it('Should edit array with complex type(enum)', () => {
        setFieldType(1, 'enum');
        cy.get(`[data-cy="schema-row-2"] input[placeholder="symbol"]`).type('symbol1{enter}');
        cy.get(`[data-cy="schema-row-3"] input[placeholder="symbol"]`).type('symbol2{enter}');
        checkForSchema({
          type: 'array',
          items: {
            type: 'enum',
            symbols: ['symbol1', 'symbol2'],
          },
        });
      });
    });

    describe('Schema with union type', () => {
      it('Should add union complex type', () => {
        openProjectionTransform();
        addField(0, 'Name', 'union');
        checkForSchema(['string']);
      });

      it('Should edit union with simple type(int)', () => {
        openProjectionTransform();
        addField(0, 'Name', 'union');
        setFieldType(1, 'int');
        checkForSchema(['int']);
      });

      it('Should edit union with simple type(long)', () => {
        cy.get(`[data-cy="schema-row-1"] [data-cy="schema-field-add-button"]`).click();
        setFieldType(2, 'long');
        checkForSchema(['int', 'long']);
      });

      it('Should edit union with complex type(record)', () => {
        openProjectionTransform();
        addField(0, 'Name', 'union');
        setFieldType(1, 'record');
        addField(2, 'record1');
        addField(3, 'record2');
        addField(4, 'record3');
        checkForSchema([
          {
            type: 'record',
            fields: [
              {
                name: 'record1',
                type: 'string',
              },
              {
                name: 'record2',
                type: 'string',
              },
              {
                name: 'record3',
                type: 'string',
              },
            ],
          },
        ]);
      });

      it('Should edit union with complex type(enum)', () => {
        setFieldType(1, 'enum');
        cy.get('[data-cy="schema-row-2"] [placeholder="symbol"]').type('symbol1{enter}');
        cy.get('[data-cy="schema-row-3"] [placeholder="symbol"]').type('symbol2{enter}');
        cy.get('[data-cy="schema-row-4"] [placeholder="symbol"]').type('symbol3{enter}');
        checkForSchema([
          {
            type: 'enum',
            symbols: ['symbol1', 'symbol2', 'symbol3'],
          },
        ]);
      });
    });
  });

  describe('Schema actions', () => {
    // export is already tested across all other tests. Not adding one explicitly

    describe('Schema import action', () => {
      it('Should import the schema right (complex schema)', () => {
        openProjectionTransform();
        /**
         * cy.emit needs listeners before it emits the import event
         * Because opening the plugin modal is async we need to make sure
         * the schema editor is loaded and the listeners are ready
         * for the 'schema.import' event.
         */
        cy.get(`[data-cy="schema-row-0"] [placeholder="Field name"]`)
          .invoke('val')
          .then((value) => {
            expect(value).to.equal('');
          })
          .then(() => {
            cy.fixture('plugin-schema/simple-schema.json').then((simpleSchema) => {
              cy.emit('schema.import', JSON.stringify(simpleSchema));
            });
          })
          .then(() => {
            cy.get(`[data-cy="schema-row-0"] [placeholder="Field name"]`)
              .invoke('val')
              .then((value) => {
                expect(value).to.equal('arr5');
              });
          });
      });

      it('Should collapse by defalt on import', () => {
        cy.get('[data-cy="schema-fields-list"]').then((el) => {
          expect(el[0].children.length).equal(1);
        });
      });

      it('Should show entire schema on expand', () => {
        cy.get('[data-cy="schema-row-0"] [data-cy="expand-button"]').click();
        cy.get('[data-cy="schema-row-1"] [data-cy="expand-button"]').click();
        cy.get('[data-cy="schema-fields-list"]').then((el) => {
          expect(el[0].children.length).equal(5);
        });
      });

      it('Should correctly detect nullable fields and render', () => {
        cy.get('[data-cy="schema-row-0"] input[type="checkbox"]').should('be.checked');
        cy.get('[data-cy="schema-row-1"] input[type="checkbox"]').should('be.checked');
        cy.get('[data-cy="schema-row-2"] input[type="checkbox"]').should('be.checked');
        cy.get('[data-cy="schema-row-3"] input[type="checkbox"]').should('be.checked');
        cy.get('[data-cy="schema-row-4"] input[type="checkbox"]').should('be.checked');
      });
    });

    describe('Schema clear action', () => {
      it('Should clear empty schema', () => {
        openProjectionTransform();
        cy.get('[data-cy="select-schema-actions-dropdown"] [role="button"]').click();
        cy.get('[data-cy="option-clear"]').click();
        cy.get('[data-cy="schema-fields-list"]').then((el) => {
          expect(el[0].children.length).equal(1);
        });
        cy.get(`[data-cy="schema-row-0"] [placeholder="Field name"]`)
          .invoke('val')
          .then((value) => {
            expect(value).to.equal('');
          });
      });

      it('Should clear a valid schema', () => {
        openProjectionTransform();
        /**
         * cy.emit needs listeners before it emits the import event
         * Because opening the plugin modal is async we need to make sure
         * the schema editor is loaded and the listeners are ready
         * for the 'schema.import' event.
         */
        cy.get(`[data-cy="schema-row-0"] [placeholder="Field name"]`)
          .invoke('val')
          .then((value) => {
            expect(value).to.equal('');
          })
          .then(() => {
            cy.fixture('plugin-schema/simple-schema.json').then((simpleSchema) => {
              cy.emit('schema.import', JSON.stringify(simpleSchema));
            });
          })
          .then(() => {
            cy.get(`[data-cy="schema-row-0"] [placeholder="Field name"]`)
              .invoke('val')
              .then((value) => {
                expect(value).to.equal('arr5');
              });
          });
        cy.get('[data-cy="select-schema-actions-dropdown"] [role="button"]').click();
        cy.get('[data-cy="option-clear"]').click();
        cy.get('[data-cy="schema-fields-list"]').then((el) => {
          expect(el[0].children.length).equal(1);
        });
        cy.get(`[data-cy="schema-row-0"] [placeholder="Field name"]`)
          .invoke('val')
          .then((value) => {
            expect(value).to.equal('');
          });
      });
    });

    describe('Schema editor should handle macros correctly', () => {
      it('Should show macro option only on macro enabled plugins', () => {
        cy.visit('/pipelines/ns/default/studio');
        cy.create_simple_pipeline().then(({ sourceNodeId }) => {
          cy.open_node_property(sourceNodeId);
          cy.get('[data-cy="select-schema-actions-dropdown"] [role="button"]').click();
          cy.get('[data-cy="schema-actions-dropdown-menu-list"] [data-cy="option-macro"]').should(
            'be.visible'
          );
        });
        openProjectionTransform();
        cy.get('[data-cy="select-schema-actions-dropdown"] [role="button"]').click();
        cy.get('[data-cy="schema-actions-dropdown-menu-list"] [data-cy="option-macro"]').should(
          'does.not.exist'
        );
        cy.get('body').click();
        cy.close_node_property();
      });
      it('Should toggle between macro and schema editor', () => {
        cy.visit('/pipelines/ns/default/studio');
        cy.create_simple_pipeline().then(({ sourceNodeId, transformNodeId }) => {
          const outputSchemaMacro = '${output_schema}';
          const validSchema = {
            name: 'etlSchemaBody',
            type: 'record',
            fields: [
              {
                name: 'Name',
                type: 'string',
              },
              {
                name: 'Email',
                type: 'string',
              },
            ],
          };
          cy.open_node_property(sourceNodeId);
          cy.get('[data-cy="select-schema-actions-dropdown"] [role="button"]').click();
          cy.get('[data-cy="schema-actions-dropdown-menu-list"] [data-cy="option-macro"]').click();
          cy.get('[data-cy="Output Schema-macro-input"]')
            .clear()
            .type(outputSchemaMacro, {
              parseSpecialCharSequences: false,
            });
          cy.close_node_property();
          cy.get_pipeline_json().then((pipelineConfig) => {
            const stages = pipelineConfig.config.stages;
            const source = stages.find((stage) => stage.name === 'BigQueryTable');
            expect(source.plugin.properties.schema).to.equal(outputSchemaMacro);
          });
          cy.open_node_property(transformNodeId);
          cy.get('[data-cy="Input Schema"]').contains(outputSchemaMacro);
          cy.close_node_property();
          cy.open_node_property(sourceNodeId);
          cy.get('[data-cy="select-schema-actions-dropdown"] [role="button"]').click();
          cy.get('[data-cy="schema-actions-dropdown-menu-list"] [data-cy="option-macro"]').click();
          addField(0, 'Name');
          addField(1, 'Email');
          cy.close_node_property();
          cy.get_pipeline_json().then((pipelineConfig) => {
            const stages = pipelineConfig.config.stages;
            const source = stages.find((stage) => stage.name === 'BigQueryTable');
            expect(source.plugin.properties.schema).to.equal(JSON.stringify(validSchema));
          });
        });
      });
    });
  });

  describe('Schema editor integration with wrangler', () => {
    /**
     * TODO: Once we add new tests for wrangler we should extract
     * this function out to be more generic.
     */

    const createWorkspace = () => {
      return cy.fixture('airports.csv').then((fileContents) => {
        cy.request({

          url: `http://${Cypress.env(
              'host'
            )}:11015/v3/namespaces/system/apps/dataprep/services/service/methods/v2/contexts/default/workspaces/upload`,
          method: 'POST',
          headers: {
            'content-type': 'application/data-prep',
            file: 'airports.csv',
            recorddelimiter: '\\n',
            'x-archive-name': 'airports.csv',
            'x-requested-with': 'XMLHttpRequest',
            ...headers,
          },
          body: fileContents
        }).then((response) => {
          const workspace = response.body;
          return workspace;
        });
      });
    };
    const resetDirectives = (workspace) => {
      return cy
        .request({
          url: `http://${Cypress.env(
            'host'
          )}:11015/v3/namespaces/system/apps/dataprep/services/service/methods/v2/contexts/default/workspaces/${workspace}`,
          headers,
        })
        .then((response) => {
          const workspaceInfo = JSON.parse(response.body);
          if (workspaceInfo.recipe && workspaceInfo.directives.length > 0) {
            workspaceInfo.directives = [];
            return cy.request({
              url: `http://${Cypress.env(
                'host'
              )}:11015/v3/namespaces/system/apps/dataprep/services/service/methods/v2/contexts/default/workspaces/${workspace}/execute`,
              method: 'POST',
              body: workspaceInfo,
              headers,
            });
          }
        })
        .then(() => {
          return cy.visit(`/cdap/ns/default/wrangler/${workspace}`);
        });
    };
    const applyDirectiveAndCreatePipeline = () => {
      cy.wait(2000);
      cy.get('input[id="directive-input"]')
        .type('parse-as-csv :body , true')
        .type('{enter}');
      cy.wait(2000);
      cy.contains('Create a Pipeline').click();
      return cy.contains('Batch pipeline').click();
    };
    it('Should render the schema when navigating from wrangler', () => {
      createWorkspace()
        .then(resetDirectives)
        .then(applyDirectiveAndCreatePipeline)
        .then(() => {
          const wrangler: INodeInfo = { nodeName: 'Wrangler', nodeType: 'transform' };
          const wranglerId: INodeIdentifier = { ...wrangler, nodeId: '0' };
          cy.open_node_property(wranglerId);
          cy.get('[data-cy="schema-fields-list"]').then((el) => {
            expect(el[0].children.length).equal(8);
          });
          cy.get('[data-cy="directives"]')
            .contains('Wrangle')
            .click();
          cy.get('[data-cy="dataprep-side-panel"]')
            .contains('Transformation steps')
            .click();
          cy.wait(100);
          cy.get('[data-cy="directive-row-0"] [data-cy="delete-directive"]').click();
          cy.get('[data-cy="loading-svg-centered"]').should('not.be.visible');
          cy.get('.action-buttons')
            .contains('Apply')
            .click();
          cy.get('.action-buttons').should('not.contain', 'Apply');
          cy.get('[data-cy="schema-fields-list"]').then((el) => {
            expect(el[0].children.length).equal(1);
          });
        });
    });
  });

  describe('Should show disabled schema in detailed view', () => {
    it('Should be disabled in deployed pipeline', () => {
      const testPipeline = `test_pipeline_${Date.now()}`;
      Helpers.deployAndTestPipeline('fll_wrangler-test-pipeline.json', testPipeline);

      // this wait is a bit arbitrary since cypress needs the UI to settle down in the detail page before
      // attempting to open wrangler node
      cy.wait(2000);

      const wrangler: INodeInfo = { nodeName: 'Wrangler', nodeType: 'transform' };
      const wranglerId: INodeIdentifier = { ...wrangler, nodeId: '1' };
      /**
       * TODO:
       * 1. For some reason the localstorage is cleared out on publishing the pipeline
       * Need to debug why this is hapening.
       * 2. Cypress won't wait for page to be loaded before opening the node.
       * So the first time the test will fail and the second retry should pass.
       */
      Helpers.setNewSchemaEditor('true');
      cy.open_node_property(wranglerId, { force: true }).then(() => {
        cy.wait(2000);
        cy.get('.loading-message').should('not.be.visible');
        cy.get('[data-cy="Output Schema"] [data-cy="schema-editor-fieldset-container"]', {
          timeout: 60000,
        }).should('be.disabled');
      });
    });
  });

  describe('Should surface errors from stage validation', () => {
    it('Should show validation for both input & output schemas', () => {
      const file: INodeInfo = { nodeName: 'File', nodeType: 'batchsource' };
      const fileId: INodeIdentifier = { ...file, nodeId: '0' };
      const speechToText: INodeInfo = { nodeName: 'SpeechToText', nodeType: 'transform' };
      const speechToTextId: INodeIdentifier = { ...speechToText, nodeId: '1' };
      cy.visit('/pipelines/ns/default/studio');
      cy.add_node_to_canvas(fileId);
      cy.open_transform_panel();
      cy.add_node_to_canvas(speechToTextId);
      cy.connect_two_nodes(fileId, speechToTextId, Helpers.getGenericEndpoint);

      cy.open_node_property(fileId);
      cy.wait(5000); // the format plugin has to fetch formats from backend.
      cy.get('[data-cy="select-format"] [role="button"').click();
      cy.get('[data-cy="option-text"]').click();
      cy.get(`[data-cy="schema-row-1"] input[placeholder="Field name"]`).type('{enter}');
      addField(2, 'unknownfield');
      addField(3, 'onemorefield');

      cy.get('input[data-cy="referenceName"]').type('FileRef');
      cy.get('input[data-cy="path"]').type('file_path');
      cy.get('[data-cy="select-format"]').click();
      cy.get('[data-cy="option-text"]').click();
      cy.get('[data-cy="plugin-properties-validate-btn"]').click();
      cy.get(`[data-cy="schema-row-2"] [data-cy="error-icon"]`).then((el) => {
        expect(el).to.have.attr(
          'title',
          `The schema for the 'text' format must only contain the ''offset' and 'body' fields'. Remove additional field 'unknownfield'.`
        );
      });
      cy.get(`[data-cy="schema-row-3"] [data-cy="error-icon"]`).then((el) => {
        expect(el).to.have.attr(
          'title',
          `The schema for the 'text' format must only contain the ''offset' and 'body' fields'. Remove additional field 'onemorefield'.`
        );
      });
      cy.get('[data-cy="plugin-properties-validate-btn"]').click();
      cy.get(`[data-cy="schema-row-2"] [data-cy="error-icon"]`).should('not.exist');
      cy.get(`[data-cy="schema-row-3"] [data-cy="error-icon"]`).should('not.exist');
      removeField(2);
      removeField(2);
      cy.close_node_property();

      cy.open_node_property(speechToTextId);
      cy.get('input[data-cy="audiofield"]').type('body');
      cy.get('input[data-cy="samplerate"]').type('16000');
      cy.get('[data-cy="plugin-properties-validate-btn"]').click();

      cy.get('[data-cy="Input Schema"] [data-cy="schema-row-1"] [data-cy="error-icon"]').then(
        (el) => {
          expect(el).to.have.attr(
            'title',
            `Field 'body' is of unsupported type 'string'. Ensure it is of type 'bytes'.`
          );
        }
      );
      cy.get('[data-cy="configuration-group"]')
        .scrollIntoView()
        .contains(`Field 'body' is of unsupported type 'string'. Ensure it is of type 'bytes'.`);
    });
  });

  describe('Should perform right client side validation', () => {
    it('Should correctly validate invalid name', () => {
      const invalidName = 'invalue@$RWEDSW#@$##!#$@#';
      cy.visit('/pipelines/ns/default/studio');
      openProjectionTransform();
      addField(0, invalidName);
      cy.get('[data-cy="schema-editor-fieldset-container"]').contains(
        `invalid field name: ${invalidName}`
      );
      removeField(0);
      addField(0, 'Name', 'record');
      addField(1, invalidName);
      cy.get('[data-cy="schema-row-0"] [data-cy="error-icon"]').then((el) => {
        expect(el).to.have.attr('title', `invalid field name: ${invalidName}`);
      });
      cy.compareSnapshot('error_highlighted_output_schema');
    });
    it('Should surface right message while importing invalid json for schema', () => {
      cy.visit('/pipelines/ns/default/studio');
      openProjectionTransform();
      cy.get(`[data-cy="schema-row-0"] [placeholder="Field name"]`)
        .invoke('val')
        .then((value) => {
          expect(value).to.equal('');
        })
        .then(() => {
          cy.fixture('plugin-schema/simple-schema.json').then((simpleSchema) => {
            const strJson = JSON.stringify(simpleSchema);
            cy.emit('schema.import', strJson + ';');
            cy.get('[data-cy="alert"]').contains(`Unexpected token ; in JSON at position 346`);
            cy.get('[data-cy="alert"] .icon-close').click();
            cy.emit('schema.import', strJson);
            cy.get(`[data-cy="schema-row-0"] [placeholder="Field name"]`)
              .invoke('val')
              .then((value) => {
                expect(value).to.equal('arr5');
              });
          });
        });
    });
    it('Should import schema with invalid name and surface right error message', () => {
      cy.visit('/pipelines/ns/default/studio');
      openProjectionTransform();
      cy.get(`[data-cy="schema-row-0"] [placeholder="Field name"]`)
        .invoke('val')
        .then((value) => {
          expect(value).to.equal('');
        })
        .then(() => {
          cy.fixture('plugin-schema/error-schema.json').then((errorSchema) => {
            cy.emit('schema.import', JSON.stringify(errorSchema));
            cy.get('[data-cy="Output Schema"]').contains('invalid field name: 1svsd');
            cy.close_node_property();
            const projection: INodeInfo = { nodeName: 'Projection', nodeType: 'transform' };
            const projectionId: INodeIdentifier = { ...projection, nodeId: '0' };
            cy.open_node_property(projectionId);
            cy.get('[data-cy="Output Schema"]').contains('invalid field name: 1svsd');
          });
        });
    });
  });
});
