import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, forwardRef, Inject, Injector, NgModule, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { InputConverter } from '../../../decorators';
import { IIntegerPipeArgument, OIntegerPipe } from '../../../pipes';
import { OSharedModule } from '../../../shared';
import { Util } from '../../../util/util';
import { OFormComponent } from '../../form/o-form.component';
import { IFormValueOptions, OFormValue } from '../../form/OFormValue';
import { DEFAULT_INPUTS_O_TEXT_INPUT, DEFAULT_OUTPUTS_O_TEXT_INPUT, OTextInputComponent, OTextInputModule } from '../text-input/o-text-input.component';

export const DEFAULT_INPUTS_O_INTEGER_INPUT = [
  ...DEFAULT_INPUTS_O_TEXT_INPUT,
  'min',
  'max',
  'step',
  'grouping',
  'thousandSeparator : thousand-separator',
  'olocale : locale'
];

export const DEFAULT_OUTPUTS_O_INTEGER_INPUT = [
  ...DEFAULT_OUTPUTS_O_TEXT_INPUT
];

@Component({
  moduleId: module.id,
  selector: 'o-integer-input',
  templateUrl: './o-integer-input.component.html',
  styleUrls: ['./o-integer-input.component.scss'],
  inputs: DEFAULT_INPUTS_O_INTEGER_INPUT,
  outputs: DEFAULT_OUTPUTS_O_INTEGER_INPUT,
  encapsulation: ViewEncapsulation.None
})
export class OIntegerInputComponent extends OTextInputComponent implements AfterViewInit, OnInit {

  public static DEFAULT_INPUTS_O_INTEGER_INPUT = DEFAULT_INPUTS_O_INTEGER_INPUT;
  public static DEFAULT_OUTPUTS_O_INTEGER_INPUT = DEFAULT_OUTPUTS_O_INTEGER_INPUT;

  inputType: string = 'number';

  @InputConverter()
  min: number;
  @InputConverter()
  max: number;
  @InputConverter()
  step: number = 1;

  @InputConverter()
  protected grouping: boolean = false;
  protected thousandSeparator: string;
  protected olocale: string;

  protected componentPipe: OIntegerPipe;
  protected pipeArguments: IIntegerPipeArgument;

  constructor(
    @Optional() @Inject(forwardRef(() => OFormComponent)) form: OFormComponent,
    elRef: ElementRef,
    injector: Injector
  ) {
    super(form, elRef, injector);
    this._defaultSQLTypeKey = 'INTEGER';

    // Firefox workaround
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
      this.inputType = 'text';
    }

    this.setComponentPipe();
  }

  initialize(): void {
    super.initialize();
    this.initializeStep();
  }

  setComponentPipe() {
    this.componentPipe = new OIntegerPipe(this.injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.pipeArguments = {
      grouping: this.grouping,
      thousandSeparator: this.thousandSeparator,
      locale: this.olocale
    };

    if (this.step === undefined) {
      this.step = 1;
    }
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
  }

  setData(value: any) {
    super.setData(value);
    setTimeout(() => {
      this.setPipeValue();
    }, 0);
  }

  setValue(val: any, options?: IFormValueOptions) {
    super.setValue(val, options);
    this.setPipeValue();
  }

  innerOnChange(event: any) {
    // Ensure integer value
    if (Util.isDefined(event)) {
      event = parseInt(event, 10);
    }
    super.innerOnChange(isNaN(event) ? void 0 : event);
  }

  innerOnFocus(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (this.isReadOnly) {
      return;
    }
    this.setNumberDOMValue(this.getValue());
    super.innerOnFocus(event);
  }

  innerOnBlur(event?: any) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.isReadOnly) {
      return;
    }
    this.setPipeValue();
    const formControl: FormControl = this.getControl();
    if (formControl) {
      formControl.updateValueAndValidity();
    }
    super.innerOnBlur(event);
  }

  setPipeValue() {
    if (typeof this.pipeArguments !== 'undefined' && !this.isEmpty()) {
      const parsedValue = this.componentPipe.transform(this.getValue(), this.pipeArguments);
      this.setTextDOMValue(parsedValue);
    }
  }

  isEmpty(): boolean {
    if (this.value instanceof OFormValue) {
      if (this.value.value !== undefined) {
        return false;
      }
    }
    return true;
  }

  getInputEl() {
    let inputElement;
    if (this.elRef.nativeElement.tagName === 'INPUT') {
      inputElement = this.elRef.nativeElement;
    } else {
      inputElement = this.elRef.nativeElement.getElementsByTagName('INPUT')[0];
    }
    return inputElement;
  }

  setNumberDOMValue(val: any) {
    const inputElement = this.getInputEl();
    if (Util.isDefined(inputElement)) {
      // Firefox workaround
      if (navigator.userAgent.toLowerCase().indexOf('firefox') === -1) {
        inputElement.type = 'number';
      }
      inputElement.value = (val !== undefined) ? val : '';
    }
  }

  setTextDOMValue(val: any) {
    const inputElement = this.getInputEl();
    if (Util.isDefined(inputElement)) {
      // Firefox workaround
      if (navigator.userAgent.toLowerCase().indexOf('firefox') === -1) {
        inputElement.type = 'text';
      }
      inputElement.value = (val !== undefined) ? val : '';
    }
  }

  resolveValidators(): ValidatorFn[] {
    const validators: ValidatorFn[] = super.resolveValidators();
    if (Util.isDefined(this.min)) {
      validators.push(this.minValidator.bind(this));
    }
    if (Util.isDefined(this.max)) {
      validators.push(this.maxValidator.bind(this));
    }
    return validators;
  }

  protected minValidator(control: FormControl): ValidationErrors {
    if ((typeof (control.value) === 'number') && (control.value < this.min)) {
      return {
        min: {
          requiredMin: this.min
        }
      };
    }
    return {};
  }

  protected maxValidator(control: FormControl): ValidationErrors {
    if ((typeof (control.value) === 'number') && (this.max < control.value)) {
      return {
        max: {
          requiredMax: this.max
        }
      };
    }
    return {};
  }

  protected initializeStep(): void {
    if (this.step <= 0) {
      this.step = 1;
      console.warn('`step` attribute must be greater than zero');
    }
  }

}

@NgModule({
  declarations: [OIntegerInputComponent],
  imports: [CommonModule, OSharedModule, OTextInputModule],
  exports: [OIntegerInputComponent, OTextInputModule]
})
export class OIntegerInputModule { }
