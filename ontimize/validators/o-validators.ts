import { FormControl, ValidationErrors } from '@angular/forms';

const EMAIL_REGEXP = /[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?/;

//NIF Regular Expressions
const DNI_PATTERN = '^(([0-9]{8})([-]?)([a-zA-Z]{1}))$';
const NIE_PATTERN = '^(([x-zX-Z]{1})([-]?)([0-9]{7})([-]?)([a-zA-Z]{1}))$';
const DNI_CHECK = 'TRWAGMYFPDXBNJZSQVHLCKET';
const NUMBERS = '0123456789';
const TWELVE_HOUR_FORMAT_PATTERN = '(([01]?[0-9]):([0-5][0-9]) ([AaPp][Mm]))';
const TWENTY_FOUR_HOUR_FORMAT_PATTERN = '([01]?[0-9]|2[0-3]):[0-5][0-9]';

export class OValidators {

  /**
* Hour validator hh:mm am/pm format
*/
  static twelveHourFormatValidator(control: FormControl): ValidationErrors {
    let regExp = new RegExp(TWELVE_HOUR_FORMAT_PATTERN);
    if (control.value && typeof control.value === 'string' && !regExp.test(control.value)) {
      return { 'invalidFormatHour': true };
    }
    return {};
  }

  /**
  * Hour validator HH:mm format
  */
  static twentyFourHourFormatValidator(control: FormControl): ValidationErrors {
    let regExp = new RegExp(TWENTY_FOUR_HOUR_FORMAT_PATTERN);
    if (control.value && typeof control.value === 'string' && !regExp.test(control.value)) {
      return { 'invalidFormatHour': true };
    }
    return {};
  }

  /**
   * Email validator
   */
  static emailValidator(control: FormControl): ValidationErrors {
    if (control.value && control.value.length > 0 && !EMAIL_REGEXP.test(control.value)) {
      return { 'invalidEmailAddress': true };
    }
    return {};
  }

  /**
   * NIF validator
   */
  static nifValidator(control: FormControl): ValidationErrors {
    let newValue = control.value;
    let regExp = new RegExp(DNI_PATTERN + '|' + NIE_PATTERN);

    // removing dashes
    let valueWithoutDashes = '';
    for (let i in newValue) {
      if (newValue[i] !== '-') {
        valueWithoutDashes = valueWithoutDashes + newValue[i];
      }
    }
    if (valueWithoutDashes.length > 1) {
      let firstChar = valueWithoutDashes.charAt(0);
      if (NUMBERS.indexOf(firstChar) !== -1) {
        let number = valueWithoutDashes.substring(0, valueWithoutDashes.length - 1);
        let pos = parseInt(number, 10) % 23;
        let expectedLetter = DNI_CHECK.substring(pos, pos + 1);
        let letter = valueWithoutDashes.charAt(valueWithoutDashes.length - 1);
        let dniLetterError = (expectedLetter !== letter.toUpperCase());
        if (dniLetterError) {
          return { 'invalidNIFLetter': true };
        } else {
          if (!regExp.test(valueWithoutDashes)) {
            return { 'invalidNIF': true };
          }
        }
      } else {
        if (!regExp.test(valueWithoutDashes)) {
          return { 'invalidNIF': true };
        }
      }
    }
    return undefined;
  }

}
