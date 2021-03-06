/*
 * Copyright © 2019 Cask Data, Inc.
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
import { ContextMenu, IContextMenuOption } from 'components/shared/ContextMenu';
import PropTypes from 'prop-types';
import { copyToClipBoard } from 'services/Clipboard';
import IconSVG from 'components/shared/IconSVG';
import CommentIcon from 'components/AbstractWidget/Comment/CommentIcon';

export default function PluginContextMenu({
  nodeId,
  getPluginConfiguration,
  getSelectedConnections,
  getSelectedNodes,
  onDelete,
  onOpen,
  onAddComment,
}) {
  const PluginContextMenuOptions: IContextMenuOption[] = [
    {
      name: 'plugin comment',
      label: 'Add a comment',
      icon: <CommentIcon size="small" />,
      onClick: () => {
        onAddComment(nodeId);
      },
    },
    {
      name: 'plugin copy',
      label: () => (getSelectedNodes().length > 1 ? 'Copy Plugins' : 'Copy Plugin'),
      icon: <IconSVG name="icon-filecopyaction" />,
      onClick: () => {
        const stages = getPluginConfiguration().stages;
        const connections = getSelectedConnections();
        const text = JSON.stringify({
          stages,
          connections,
        });
        copyToClipBoard(text).then(
          () => {
            /* tslint:disable:no-console */
            console.log('Success now show a tooltip or something to the user');
          },
          () => {
            /* tslint:disable:no-console */
            console.error('Fail!. Show to the user copy failed');
          }
        );
      },
    },
    {
      name: 'plugin delete',
      icon: <IconSVG name="icon-trash" />,
      label: () => (getSelectedNodes().length > 1 ? 'Delete Plugins' : 'Delete Plugin'),
      onClick: () => {
        onDelete();
      },
    },
  ];
  const onPluginContextMenuOpen = () => {
    onOpen(nodeId);
  };
  return (
    <React.Fragment>
      <ContextMenu
        selector={`[id="${nodeId}"]`}
        options={PluginContextMenuOptions}
        onOpen={onPluginContextMenuOpen}
      />
    </React.Fragment>
  );
}

(PluginContextMenu as any).propTypes = {
  nodeId: PropTypes.string,
  getPluginConfiguration: PropTypes.func,
  getSelectedConnections: PropTypes.func,
  getSelectedNodes: PropTypes.func,
  onDelete: PropTypes.func,
  onOpen: PropTypes.func,
  onAddComment: PropTypes.func,
};
