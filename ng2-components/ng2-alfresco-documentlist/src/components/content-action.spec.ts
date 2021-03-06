/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    it,
    describe,
    expect,
    beforeEach
} from '@angular/core/testing';
import { EventEmitter } from '@angular/core';

import { DocumentList } from './document-list';
import { AlfrescoServiceMock } from '../assets/alfresco.service.mock';
import { ContentActionList } from './content-action-list';
import { ContentAction } from './content-action';
import { DocumentActionsService } from '../services/document-actions.service';
import { FolderActionsService } from '../services/folder-actions.service';
import { ContentActionHandler } from '../models/content-action.model';
import { FileNode } from '../assets/document-library.model.mock';

describe('ContentAction', () => {

    let documentList: DocumentList;
    let actionList: ContentActionList;
    let documentActions: DocumentActionsService;
    let folderActions: FolderActionsService;

    beforeEach(() => {
        let alfrescoServiceMock = new AlfrescoServiceMock();
        documentActions = new DocumentActionsService(null, null);
        folderActions = new FolderActionsService(null);

        documentList = new DocumentList(alfrescoServiceMock, null);
        actionList = new ContentActionList(documentList);
    });

    it('should register within parent actions list', () => {
        spyOn(actionList, 'registerAction').and.stub();

        let action = new ContentAction(actionList, null, null);
        action.ngOnInit();

        expect(actionList.registerAction).toHaveBeenCalled();
    });

    it('should setup and register model', () => {
        let action = new ContentAction(actionList, null, null);
        action.type = 'button';
        action.target = 'document';
        action.title = '<title>';
        action.icon = '<icon>';

        expect(documentList.actions.length).toBe(0);
        action.ngOnInit();

        expect(documentList.actions.length).toBe(1);

        let model = documentList.actions[0];
        expect(model.type).toBe(action.type);
        expect(model.target).toBe(action.target);
        expect(model.title).toBe(action.title);
        expect(model.icon).toBe(action.icon);
    });

    it('should get action handler from document actions service', () => {

        let handler = function() {};
        spyOn(documentActions, 'getHandler').and.returnValue(handler);

        let action = new ContentAction(actionList, documentActions, null);
        action.type = 'button';
        action.target = 'document';
        action.handler = '<handler>';
        action.ngOnInit();

        expect(documentActions.getHandler).toHaveBeenCalledWith(action.handler);
        expect(documentList.actions.length).toBe(1);

        let model = documentList.actions[0];
        expect(model.handler).toBe(handler);
    });

    it('should get action handler from folder actions service', () => {
        let handler = function() {};
        spyOn(folderActions, 'getHandler').and.returnValue(handler);

        let action = new ContentAction(actionList, null, folderActions);
        action.type = 'button';
        action.target = 'folder';
        action.handler = '<handler>';
        action.ngOnInit();

        expect(folderActions.getHandler).toHaveBeenCalledWith(action.handler);
        expect(documentList.actions.length).toBe(1);

        let model = documentList.actions[0];
        expect(model.handler).toBe(handler);
    });

    it('should require target to get system handler', () => {
        spyOn(folderActions, 'getHandler').and.stub();
        spyOn(documentActions, 'getHandler').and.stub();

        let action = new ContentAction(actionList, documentActions, folderActions);
        action.type = 'button';
        action.handler = '<handler>';

        action.ngOnInit();
        expect(documentList.actions.length).toBe(1);
        expect(folderActions.getHandler).not.toHaveBeenCalled();
        expect(documentActions.getHandler).not.toHaveBeenCalled();

        action.target = 'document';
        action.ngOnInit();
        expect(documentActions.getHandler).toHaveBeenCalled();

        action.target = 'folder';
        action.ngOnInit();
        expect(folderActions.getHandler).toHaveBeenCalled();
    });

    it('should be case insensitive for document target', () => {
        spyOn(documentActions, 'getHandler').and.stub();

        let action = new ContentAction(actionList, documentActions, null);
        action.target = 'DoCuMeNt';
        action.type = 'button';
        action.handler = '<handler>';

        action.ngOnInit();
        expect(documentActions.getHandler).toHaveBeenCalledWith(action.handler);
    });

    it('should be case insensitive for folder target', () => {
        spyOn(folderActions, 'getHandler').and.stub();

        let action = new ContentAction(actionList, null, folderActions);
        action.target = 'FoLdEr';
        action.type = 'button';
        action.handler = '<handler>';

        action.ngOnInit();
        expect(folderActions.getHandler).toHaveBeenCalledWith(action.handler);
    });

    it('should use custom "execute" emitter', (done) => {
        let emitter = new EventEmitter();

        emitter.subscribe(e => {
            expect(e.value).toBe('<obj>');
            done();
        });

        let action = new ContentAction(actionList, null, null);
        action.target = 'document';
        action.type = 'button';
        action.execute = emitter;

        action.ngOnInit();
        expect(documentList.actions.length).toBe(1);

        let model = documentList.actions[0];
        model.handler('<obj>');
    });

    it('should sync localizable fields with model', () => {

        let action = new ContentAction(actionList, null, null);
        action.title = 'title1';
        action.ngOnInit();

        expect(action.model.title).toBe(action.title);

        action.title = 'title2';
        action.ngOnChanges(null);

        expect(action.model.title).toBe('title2');
    });

    it('should not find document action handler with missing service', () => {
        let action = new ContentAction(actionList, null, null);
        expect(action.getSystemHandler('document', 'name')).toBeNull();
    });

    it('should not find folder action handler with missing service', () => {
        let action = new ContentAction(actionList, null, null);
        expect(action.getSystemHandler('folder', 'name')).toBeNull();
    });

    it('should find document action handler via service', () => {
        let handler = <ContentActionHandler> function (obj: any, target?: any) {};
        let action = new ContentAction(actionList, documentActions, null);
        spyOn(documentActions, 'getHandler').and.returnValue(handler);
        expect(action.getSystemHandler('document', 'name')).toBe(handler);
    });

    it('should find folder action handler via service', () => {
        let handler = <ContentActionHandler> function (obj: any, target?: any) {};
        let action = new ContentAction(actionList, null, folderActions);
        spyOn(folderActions, 'getHandler').and.returnValue(handler);
        expect(action.getSystemHandler('folder', 'name')).toBe(handler);
    });

    it('should not find actions for unknown target type', () => {
        spyOn(folderActions, 'getHandler').and.stub();
        spyOn(documentActions, 'getHandler').and.stub();

        let action = new ContentAction(actionList, documentActions, folderActions);

        expect(action.getSystemHandler('unknown', 'name')).toBeNull();
        expect(folderActions.getHandler).not.toHaveBeenCalled();
        expect(documentActions.getHandler).not.toHaveBeenCalled();

    });

    it('should wire model with custom event handler', (done) => {
        let action = new ContentAction(actionList, documentActions, folderActions);
        let file = new FileNode();

        let handler = new EventEmitter();
        handler.subscribe((e) => {
            expect(e.value).toBe(file);
            done();
        });

        action.execute = handler;

        action.ngOnInit();
        action.model.handler(file);
    });

    it('should allow registering model without handler', () => {
        let action = new ContentAction(actionList, documentActions, folderActions);

        spyOn(actionList, 'registerAction').and.callThrough();
        action.execute = null;
        action.ngOnInit();

        expect(action.model.handler).toBeUndefined();
        expect(actionList.registerAction).toHaveBeenCalledWith(action.model);
    });

    it('should register on init', () => {
        let action = new ContentAction(actionList, null, null);
        spyOn(action, 'register').and.callThrough();

        action.ngOnInit();
        expect(action.register).toHaveBeenCalled();
    });

    it('should require action list to register action with', () => {
        let action = new ContentAction(actionList, null, null);
        expect(action.register()).toBeTruthy();

        action = new ContentAction(null, null, null);
        expect(action.register()).toBeFalsy();
    });
});
