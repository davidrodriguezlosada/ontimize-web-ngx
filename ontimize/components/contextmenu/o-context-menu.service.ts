import { ComponentRef, ElementRef, Injectable, QueryList } from '@angular/core';
import { Overlay, OverlayRef, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';

import { OContextMenuComponent } from './o-context-menu.component';
import { OComponentMenuItems } from './o-content-menu.class';
import { OContextMenuContentComponent } from './context-menu/o-context-menu-content.component';

export interface IOContextMenuClickEvent {
  anchorElement?: ElementRef;
  contextMenu?: OContextMenuComponent;
  event?: MouseEvent;
  data?: any;
}

export interface IOContextMenuContext extends IOContextMenuClickEvent {
  menuItems?: QueryList<OComponentMenuItems>;
}

@Injectable()
export class OContextMenuService {

  public showContextMenu: Subject<IOContextMenuClickEvent> = new Subject<IOContextMenuClickEvent>();
  public closeContextMenu: Subject<Event> = new Subject();
  activeMenu: OContextMenuContentComponent;
  backDropSub: Subscription;

  protected overlays: Array<OverlayRef> = [];
  protected fakeElement: any = {
    getBoundingClientRect: (): ClientRect => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
    })
  };

  constructor(
    private overlay: Overlay,
    private scrollStrategy: ScrollStrategyOptions
  ) { }

  public openContextMenu(context: IOContextMenuContext): void {
    this.closeContext();
    this.createOverlay(context);
  }

  public closeContext(): void {
    if (this.overlays) {
      this.overlays.forEach((overlay, index) => {
        overlay.detach();
        overlay.dispose();
      });
    }
    this.overlays = [];

    if (this.activeMenu) {
      this.activeMenu.close();
    }
  }

  protected createOverlay(context: IOContextMenuContext): void {
    context.event.preventDefault();
    context.event.stopPropagation();

    // TODO: submenu
    this.fakeElement.getBoundingClientRect = (): ClientRect => ({
      bottom: context.event.clientY,
      height: 0,
      left: context.event.clientX,
      right: context.event.clientX,
      top: context.event.clientY,
      width: 0,
    });

    /* */
    const positionStrategy = this.overlay.position().connectedTo(
      { nativeElement: context.anchorElement || this.fakeElement },
      { originX: 'start', originY: 'bottom' },
      { overlayX: 'start', overlayY: 'top' }
    ).withFallbackPosition(
      { originX: 'start', originY: 'top' },
      { overlayX: 'start', overlayY: 'bottom' })
      .withFallbackPosition(
      { originX: 'end', originY: 'top' },
      { overlayX: 'start', overlayY: 'top' })
      .withFallbackPosition(
      { originX: 'start', originY: 'top' },
      { overlayX: 'end', overlayY: 'top' })
      .withFallbackPosition(
      { originX: 'end', originY: 'center' },
      { overlayX: 'start', overlayY: 'center' })
      .withFallbackPosition(
      { originX: 'start', originY: 'center' },
      { overlayX: 'end', overlayY: 'center' });

    let overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      panelClass: ['o-context-menu'],
      scrollStrategy: this.scrollStrategy.close()
    });

    this.overlays = [overlayRef];

    this.attachContextMenu(this.overlays[0], context);
  }

  protected attachContextMenu(overlay: OverlayRef, context: IOContextMenuContext): void {
    const contextMenuContent: ComponentRef<any> = overlay.attach(new ComponentPortal(OContextMenuContentComponent));
    contextMenuContent.instance.overlay = overlay;
    contextMenuContent.instance.menuItems = context.menuItems;
    contextMenuContent.instance.data = context.data;

    this.registerBackdropEvents(overlay);
  }

  private registerBackdropEvents(overlayRef: OverlayRef) {
    const elm = overlayRef.backdropElement;
    if (elm) {
      this.backDropSub = fromEvent(elm, 'mousedown')
        .subscribe(this.closeContext.bind(this));
    }
  }

  destroy() {
    this.closeContext();
    if (this.backDropSub) {
      this.backDropSub.unsubscribe();
    }
  }

}
