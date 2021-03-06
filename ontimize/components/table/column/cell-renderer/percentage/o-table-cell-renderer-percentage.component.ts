import { Component, Injector, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { NumberService } from '../../../../../services';
import { IPercentPipeArgument, OPercentPipe, OPercentageValueBaseType } from '../../../../../pipes';
import { DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_REAL, OTableCellRendererRealComponent } from '../real/o-table-cell-renderer-real.component';

export const DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_PERCENTAGE = [
  ...DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_REAL,
  'valueBase: value-base'
];

@Component({
  moduleId: module.id,
  selector: 'o-table-cell-renderer-percentage',
  templateUrl: './o-table-cell-renderer-percentage.component.html',
  inputs: DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_PERCENTAGE
})
export class OTableCellRendererPercentageComponent extends OTableCellRendererRealComponent implements OnInit {

  public static DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_PERCENTAGE = DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_PERCENTAGE;

  protected decimalSeparator: string = '.';
  protected decimalDigits: number = 0;
  protected valueBase: OPercentageValueBaseType = 1;

  protected numberService: NumberService;

  protected componentPipe: OPercentPipe;
  protected pipeArguments: IPercentPipeArgument;

  @ViewChild('templateref', { read: TemplateRef }) public templateref: TemplateRef<any>;

  constructor(protected injector: Injector) {
    super(injector);
    this.tableColumn.type = 'real';
    this.numberService = this.injector.get(NumberService);

    if (typeof (this.decimalDigits) === 'undefined') {
      this.decimalDigits = this.numberService.minDecimalDigits;
    }
    this.setComponentPipe();
  }

  setComponentPipe() {
    this.componentPipe = new OPercentPipe(this.injector);
  }

  ngOnInit() {
    this.pipeArguments = {
      minDecimalDigits: this.decimalDigits,
      maxDecimalDigits: this.decimalDigits,
      decimalSeparator: this.decimalSeparator,
      grouping: this.grouping,
      thousandSeparator: this.thousandSeparator,
      valueBase: this.valueBase
    };
  }

}
