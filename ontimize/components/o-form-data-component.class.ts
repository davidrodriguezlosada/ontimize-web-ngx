import { Injector, ElementRef, OnInit, OnDestroy, QueryList, ViewChildren, AfterViewInit, HostBinding, ContentChildren, OnChanges, SimpleChange, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { MatSuffix } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';
import { InputConverter, BooleanConverter } from '../decorators';
import { SQLTypes, Util } from '../utils';
import { PermissionsUtils } from '../util/permissions';
import { OBaseComponent, IComponent } from './o-component.class';
import { OFormComponent } from './form/o-form.component';
import { OFormValue, IFormValueOptions } from './form/OFormValue';
import { OValidatorComponent } from './input/validation/o-validator.component';
import { OPermissions, PermissionsService } from '../services';

export interface IMultipleSelection extends IComponent {
  getSelectedItems(): Array<any>;
  setSelectedItems(values: Array<any>);
}

export interface IFormDataTypeComponent extends IComponent {
  getSQLType(): number;
}

export interface IFormControlComponent extends IComponent {
  getControl(): FormControl;
  getFormControl(): FormControl;
  hasError(error: string): boolean;
}

export interface IFormDataComponent extends IFormControlComponent {
  data(value: any);
  isAutomaticBinding(): boolean;
  isAutomaticRegistering(): boolean;
  setValue(val: any, options?: IFormValueOptions);
  clearValue(options?: IFormValueOptions);
  getValue(): any;

  onChange: EventEmitter<Object>;
  onValueChange: EventEmitter<OValueChangeEvent>;
}

export interface IErrorData {
  name: string;
  text: string;
}

export class OValueChangeEvent {
  public static USER_CHANGE = 0;
  public static PROGRAMMATIC_CHANGE = 1;

  constructor(
    public type: number,
    public newValue: any,
    public oldValue: any,
    public target: any) { }

  isUserChange(): boolean {
    return this.type === OValueChangeEvent.USER_CHANGE;
  }

  isProgrammaticChange(): boolean {
    return this.type === OValueChangeEvent.PROGRAMMATIC_CHANGE;
  }
}

export const DEFAULT_INPUTS_O_FORM_DATA_COMPONENT = [
  'oattr: attr',
  'olabel: label',
  'tooltip',
  'tooltipPosition: tooltip-position',
  'tooltipShowDelay: tooltip-show-delay',
  'data',
  'autoBinding: automatic-binding',
  'autoRegistering: automatic-registering',
  'oenabled: enabled',
  'orequired: required',
  // sqltype[string]: Data type according to Java standard. See SQLType ngClass. Default: 'OTHER'
  'sqlType: sql-type',
  'width',
  'readOnly: read-only',
  'clearButton: clear-button',
  'angularValidatorsFn: validators'
];

export const DEFAULT_OUTPUTS_O_FORM_DATA_COMPONENT = [
  'onChange',
  'onValueChange'
];

export class OFormDataComponent extends OBaseComponent implements IFormDataComponent, IFormDataTypeComponent,
  OnInit, AfterViewInit, OnDestroy, OnChanges {

  /* Inputs */
  sqlType: string;
  @InputConverter()
  autoBinding: boolean = true;
  @InputConverter()
  autoRegistering: boolean = true;
  width: string;
  @InputConverter()
  clearButton: boolean = false;
  angularValidatorsFn: ValidatorFn[] = [];

  /* Outputs */
  onChange: EventEmitter<Object> = new EventEmitter<Object>();
  onValueChange: EventEmitter<OValueChangeEvent> = new EventEmitter<OValueChangeEvent>();

  @HostBinding('style.width')
  get hostWidth() {
    return this.width;
  }

  /* Internal variables */
  protected value: OFormValue;
  protected defaultValue: any = void 0;
  protected _SQLType: number = SQLTypes.OTHER;
  protected _defaultSQLTypeKey: string = 'OTHER';
  protected _fControl: FormControl;
  protected _fGroup: FormGroup;
  protected elRef: ElementRef;
  protected form: OFormComponent;
  protected oldValue: any;

  protected matSuffixSubscription: Subscription;
  @ViewChildren(MatSuffix)
  protected _matSuffixList: QueryList<MatSuffix>;
  matSuffixClass;

  protected errorsData: IErrorData[] = [];
  protected validatorsSubscription: Subscription;
  @ContentChildren(OValidatorComponent)
  protected validatorChildren: QueryList<OValidatorComponent>;

  protected permissionsService: PermissionsService;
  protected mutationObserver: MutationObserver;

  constructor(
    form: OFormComponent,
    elRef: ElementRef,
    injector: Injector
  ) {
    super(injector);
    this.form = form;
    this.elRef = elRef;
    this.permissionsService = this.injector.get(PermissionsService);
  }

  ngOnInit() {
    this.initialize();
  }

  ngAfterViewInit(): void {
    const self = this;
    if (this._matSuffixList) {
      this.setSuffixClass(this._matSuffixList.length);
      this.matSuffixSubscription = this._matSuffixList.changes.subscribe(() => {
        self.setSuffixClass(self._matSuffixList.length);
      });
    }

    if (this.validatorChildren) {
      this.validatorsSubscription = this.validatorChildren.changes.subscribe(() => {
        self.updateValidators();
      });
      if (this.validatorChildren.length > 0) {
        this.updateValidators();
      }
    }
    if (this.isDisabled) {
      this.mutationObserver = PermissionsUtils.registerDisabledChangesInDom(this.getMutationObserverTarget(), {
        callback: this.disableFormControl.bind(this)
      });
    }
  }

  ngOnDestroy() {
    this.destroy();
  }

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    if (Util.isDefined(changes['angularValidatorsFn'])) {
      this.updateValidators();
    }
  }

  hasEnabledPermission(): boolean {
    return this.permissions ? this.permissions.enabled : true;
  }

  hasVisiblePermission(): boolean {
    return this.permissions ? this.permissions.visible : true;
  }

  getFormGroup(): FormGroup {
    if (this._fGroup) {
      return this._fGroup;
    }
    let formGroup = this.form ? this.form.formGroup : undefined;
    if ((!this.hasEnabledPermission() || !this.hasVisiblePermission()) && !this._fGroup) {
      let group = {};
      group[this.oattr] = this._fControl;
      this._fGroup = new FormGroup(group);
      formGroup = this._fGroup;
    }
    return formGroup;
  }

  getFormControl(): FormControl {
    return this._fControl;
  }

  hasError(error: string): boolean {
    return !this.isReadOnly && this._fControl && this._fControl.touched && this._fControl.hasError(error);
  }

  getErrorValue(error: string, prop: string): string {
    return this._fControl && this._fControl.hasError(error) ? this._fControl.getError(error)[prop] || '' : '';
  }

  getActiveOErrors(): IErrorData[] {
    return this.errorsData.filter((item: IErrorData) => this.hasError(item.name));
  }

  initialize() {
    super.initialize();

    // ensuring formControl creation
    this.getControl();

    this.parsePermissions();

    if (!Util.isDefined(this.permissions)) {
      if (this.form) {
        this.registerFormListeners();
        this.isReadOnly = !(this.form.isInUpdateMode() || this.form.isInInsertMode() || this.form.isEditableDetail());
      } else {
        this.isReadOnly = this._disabled;
      }
    }
  }

  protected parsePermissions() {
    // if oattr in form, it can have permissions
    if (!this.form || !Util.isDefined(this.form.oattr)) {
      return;
    }
    const permissions: OPermissions = this.form.getFormComponentPermissions(this.oattr);
    if (!Util.isDefined(permissions)) {
      return;
    }
    if (permissions.visible === false) {
      /* hide input per permissions */
      this.elRef.nativeElement.remove();
      this.destroy();
    } else if (permissions.enabled === false) {
      /* disable input per permissions */
      this.disabled = true;
      if (this.form) {
        this.form.registerFormComponent(this);
      }
    }
    this.permissions = permissions;
  }

  protected getMutationObserverTarget(): any {
    let result;
    try {
      result = this.elementRef.nativeElement.getElementsByTagName('input').item(0);
    } catch (error) {
      //
    }
    return result;
  }

  /**
   * Do not allow the disabled attribute to change by code or by inspector
   * */
  private disableFormControl() {
    const control = this.getFormControl();
    control.disable({
      onlySelf: true,
      emitEvent: false
    });
  }

  protected setSuffixClass(count: number) {
    const iconFieldEl = this.elRef.nativeElement.getElementsByClassName('icon-field');
    if (iconFieldEl.length === 1) {
      let classList = iconFieldEl[0].classList;
      classList.forEach(className => {
        if (className.startsWith('icon-field-')) {
          classList.remove(className);
        }
      });
      if (count > 0) {
        let matSuffixClass = `icon-field-${count}-suffix`;
        iconFieldEl[0].classList.add(matSuffixClass);
      }
    }
  }

  destroy() {
    this.unregisterFormListeners();
    if (this.matSuffixSubscription) {
      this.matSuffixSubscription.unsubscribe();
    }
    if (this.validatorsSubscription) {
      this.validatorsSubscription.unsubscribe();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  registerFormListeners() {
    if (this.form) {
      this.form.registerFormComponent(this);
      this.form.registerFormControlComponent(this);
      this.form.registerSQLTypeFormComponent(this);
    }
  }

  unregisterFormListeners() {
    if (this.form) {
      this.form.unregisterFormComponent(this);
      this.form.unregisterFormControlComponent(this);
      this.form.unregisterSQLTypeFormComponent(this);
    }
  }

  set data(value: any) {
    this.setData(value);
  }

  setData(value: any) {
    // emit OValueChangeEvent.PROGRAMMATIC_CHANGE when assign value to data
    // this method skips the following permissions checking because the form is
    // setting its query result using it
    this.setFormValue(value, {
      emitModelToViewChange: false,
      emitEvent: false
    }, false);
    this.emitOnValueChange(OValueChangeEvent.PROGRAMMATIC_CHANGE, value, this.oldValue);
    this.oldValue = this.value.value;
  }

  isAutomaticBinding(): boolean {
    return this.autoBinding;
  }

  isAutomaticRegistering(): boolean {
    return this.autoRegistering;
  }

  getValue(): any {
    if (this.value instanceof OFormValue) {
      if (this.value.value !== undefined) {
        return this.value.value;
      }
    }
    return this.defaultValue;
  }

  setValue(val: any, options?: IFormValueOptions) {
    if (!PermissionsUtils.checkEnabledPermission(this.permissions)) {
      return;
    }
    if (this.oldValue !== val) {
      var newValue = val;
      this.setFormValue(val, options, true);
      let changeType: number = options ? options.changeType : OValueChangeEvent.PROGRAMMATIC_CHANGE;
      this.emitOnValueChange(changeType, newValue, this.oldValue);
      this.oldValue = val;
    }
  }

  /**
   * Clears the component value.
   */
  clearValue(options?: IFormValueOptions) {
    if (!PermissionsUtils.checkEnabledPermission(this.permissions)) {
      return;
    }
    this.setValue(void 0, options);
  }

  onClickClearValue(): void {
    this.clearValue({ changeType: OValueChangeEvent.USER_CHANGE });
  }

  protected setFormValue(val: any, options?: IFormValueOptions, setDirty: boolean = false) {
    this.ensureOFormValue(val);
    if (this._fControl) {
      this._fControl.setValue(val, options);
      if (setDirty) {
        this._fControl.markAsDirty();
      }
      if (this._fControl.invalid && !this.form.isInInsertMode()) {
        this._fControl.markAsTouched();
      }
    }
  }

  /*This method is called in output change event, not emit event onValueChange when oldvalue is same than newvalue*/
  onChangeEvent($event) {
    if (this.oldValue !== this.getValue()) {
      this.emitOnValueChange(OValueChangeEvent.USER_CHANGE, this.getValue(), this.oldValue);
      this.oldValue = this.getValue();
    }
  }

  protected emitOnValueChange(type, newValue, oldValue) {
    let event = new OValueChangeEvent(type, newValue, oldValue, this);
    this.onValueChange.emit(event);
  }

  get showClearButton(): boolean {
    return this.clearButton && !this.isReadOnly && !this.isDisabled && this.getValue();
  }

  ensureOFormValue(arg: any) {
    if (arg instanceof OFormValue) {
      this.value = arg;
    } else if (Util.isDefined(arg) && !(arg instanceof OFormValue)) {
      let val: OFormValue = this.value || new OFormValue();
      val.value = arg;
      this.value = val;
    } else {
      this.value = new OFormValue(this.defaultValue);
    }
  }

  getControl(): FormControl {
    if (!this._fControl) {
      let validators: ValidatorFn[] = this.resolveValidators();
      let cfg = {
        value: this.value ? this.value.value : undefined,
        disabled: this.isDisabled
      };
      this._fControl = new FormControl(cfg, validators);
    }
    return this._fControl;
  }

  resolveValidators(): ValidatorFn[] {
    let validators: ValidatorFn[] = [];
    this.angularValidatorsFn.forEach((fn: ValidatorFn) => {
      validators.push(fn);
    });
    if (this.orequired) {
      validators.push(Validators.required);
    }
    return validators;
  }

  getSQLType(): number {
    let sqlt = this.sqlType && this.sqlType.length > 0 ? this.sqlType : this._defaultSQLTypeKey;
    this._SQLType = SQLTypes.getSQLTypeValue(sqlt);
    return this._SQLType;
  }

  get isValid() {
    if (this._fControl) {
      return this._fControl.valid;
    }
    return false;
  }

  isEmpty(): boolean {
    if (this.value instanceof OFormValue) {
      if (this.value.value !== undefined) {
        return false;
      }
    }
    return true;
  }

  set disabled(value: boolean) {
    if (!PermissionsUtils.checkEnabledPermission(this.permissions)) {
      return;
    }
    if (this.hasVisiblePermission()) {
      this._disabled = value;
      if (this._fControl && value) {
        this._fControl.disable();
      } else if (this._fControl) {
        this._fControl.enable();
      }
    }
  }

  get elementRef(): ElementRef {
    return this.elRef;
  }

  get hasCustomWidth(): boolean {
    return this.width !== undefined;
  }

  protected updateValidators() {
    if (!this._fControl) {
      return;
    }
    const self = this;
    this._fControl.clearValidators();
    this.errorsData = [];
    let validators = this.resolveValidators();
    this.validatorChildren.forEach((oValidator: OValidatorComponent) => {
      let validatorFunction: ValidatorFn = oValidator.getValidatorFn();
      if (validatorFunction) {
        validators.push(validatorFunction);
      }
      let errorsData: IErrorData[] = oValidator.getErrorsData();
      self.errorsData.push(...errorsData);
    });
    this._fControl.setValidators(validators);
  }

  get orequired(): boolean {
    return this._orequired;
  }

  set orequired(val: boolean) {
    const old = this._orequired;
    this._orequired = BooleanConverter(val);
    if (val !== old) {
      this.updateValidators();
    }
  }
}
