/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./media/part';
import { Component } from 'vs/workbench/common/component';
import { IThemeService, ITheme } from 'vs/platform/theme/common/themeService';
import { Dimension, size } from 'vs/base/browser/dom';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { IDimension } from 'vs/platform/layout/browser/layoutService';
import { ISerializableView, Orientation } from 'vs/base/browser/ui/grid/grid';
import { Event } from 'vs/base/common/event';

export interface IPartOptions {
	hasTitle?: boolean;
	borderWidth?: () => number;
}

export interface ILayoutContentResult {
	titleSize: IDimension;
	contentSize: IDimension;
}

/**
 * Parts are layed out in the workbench and have their own layout that
 * arranges an optional title and mandatory content area to show content.
 */
export abstract class Part extends Component implements ISerializableView {
	private parent: HTMLElement;
	private titleArea: HTMLElement | null;
	private contentArea: HTMLElement | null;
	private partLayout: PartLayout;

	constructor(
		id: string,
		private options: IPartOptions,
		themeService: IThemeService,
		storageService: IStorageService
	) {
		super(id, themeService, storageService);
	}

	protected onThemeChange(theme: ITheme): void {

		// only call if our create() method has been called
		if (this.parent) {
			super.onThemeChange(theme);
		}
	}

	/**
	 * Note: Clients should not call this method, the workbench calls this
	 * method. Calling it otherwise may result in unexpected behavior.
	 *
	 * Called to create title and content area of the part.
	 */
	create(parent: HTMLElement): void {
		this.parent = parent;
		this.titleArea = this.createTitleArea(parent);
		this.contentArea = this.createContentArea(parent);

		this.partLayout = new PartLayout(this.parent, this.options, this.titleArea, this.contentArea);

		this.updateStyles();
	}

	/**
	 * Returns the overall part container.
	 */
	getContainer(): HTMLElement {
		return this.parent;
	}

	/**
	 * Subclasses override to provide a title area implementation.
	 */
	protected createTitleArea(parent: HTMLElement): HTMLElement | null {
		return null;
	}

	/**
	 * Returns the title area container.
	 */
	protected getTitleArea(): HTMLElement | null {
		return this.titleArea;
	}

	/**
	 * Subclasses override to provide a content area implementation.
	 */
	protected createContentArea(parent: HTMLElement): HTMLElement | null {
		return null;
	}

	/**
	 * Returns the content area container.
	 */
	protected getContentArea(): HTMLElement | null {
		return this.contentArea;
	}

	/**
	 * Layout title and content area in the given dimension.
	 */
	protected layoutContents(width: number, height: number): ILayoutContentResult {
		return this.partLayout.layout(width, height);
	}

	//#region ISerializableView

	abstract onDidChange: Event<IDimension>;

	abstract element: HTMLElement;
	abstract minimumWidth: number;
	abstract maximumWidth: number;
	abstract minimumHeight: number;
	abstract maximumHeight: number;

	abstract layout(width: number, height: number, orientation: Orientation): void;
	abstract toJSON(): object;

	//#endregion
}

class PartLayout {

	private static readonly TITLE_HEIGHT = 35;

	constructor(container: HTMLElement, private options: IPartOptions, titleArea: HTMLElement | null, private contentArea: HTMLElement | null) { }

	layout(width: number, height: number): ILayoutContentResult {

		// Title Size: Width (Fill), Height (Variable)
		let titleSize: Dimension;
		if (this.options && this.options.hasTitle) {
			titleSize = new Dimension(width, Math.min(height, PartLayout.TITLE_HEIGHT));
		} else {
			titleSize = new Dimension(0, 0);
		}

		// Content Size: Width (Fill), Height (Variable)
		const contentSize = new Dimension(width, height - titleSize.height);

		if (this.options && typeof this.options.borderWidth === 'function') {
			contentSize.width -= this.options.borderWidth(); // adjust for border size
		}

		// Content
		if (this.contentArea) {
			size(this.contentArea, contentSize.width, contentSize.height);
		}

		return { titleSize, contentSize };
	}
}