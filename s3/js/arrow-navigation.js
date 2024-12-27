const preventDefaultKeys = [
  'SoftLeft',
  'Call',
  'Enter',
  'MicrophoneToggle',
  'EndCall',
  'AudioVolumeDown',
  'AudioVolumeUp'
];
const preventDefaultOnNumberInput = [
  'ArrowUp',
  'ArrowDown'
];
const preventDefaultIfEmptyKeys = [
  'Backspace'
];
const blurKeys = [
  'EndCall'
];
const blurIfEmptyKeys = [];
function findParentWithClass(element, className) {
  let current = element;
  while (!!current) {
    if (current.classList.contains(className)) {
      return current;
    }
    current = current.parentElement;
  }
  return current;
}
let previousValue = undefined;
let previousArrowTime = new Date();
function arrowKeyEmulator(event, functionHandle) {
  if ((event.target.tagName.toLowerCase() != 'textarea' && preventDefaultKeys.includes(event.key)) || (preventDefaultIfEmptyKeys.includes(event.key) && !event.target.value)) {
    event.preventDefault();
  }
  if (event.type == 'keydown' && event.target.type == 'number' && preventDefaultOnNumberInput.includes(event.key)) {
    event.preventDefault();
  }
  if (blurKeys.includes(event.key)) {
    event.target.blur();
  }
  if (event.type === 'keyup' && blurIfEmptyKeys.includes(event.key) && !event.target.value && !previousValue) {
    event.target.blur();
  }
  if (event.type === 'keydown' && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
    // check if you are where youre supposed to be before you go
    let tooFast = (new Date()) - previousArrowTime < 100;
    let youreWhereYoureSupposedToBe = false;
    youreWhereYoureSupposedToBe = youreWhereYoureSupposedToBe || event.target.selectionStart === null;
    youreWhereYoureSupposedToBe = youreWhereYoureSupposedToBe || (event.key == 'ArrowUp' && event.target.selectionStart == 0);
    youreWhereYoureSupposedToBe = youreWhereYoureSupposedToBe || (event.key == 'ArrowDown' && event.target.selectionStart == event.target.value.length);
    if (!tooFast && youreWhereYoureSupposedToBe) {
      let inputs = Array.from(document.getElementsByClassName('navigable-input'));
      if (event.target.hasAttribute('input-group-name')) {
        const currentTarget = event.target.getAttribute('input-group-name');
        inputs = inputs.filter(x=>x.getAttribute('input-group-name') == currentTarget);
      }
      let index = inputs.indexOf(event.target);
      do {
        index = index + (event.key === 'ArrowUp' ? -1 : 1);
        index = index < 0 ? inputs.length - 1 : index;
        index = index > inputs.length - 1 ? 0 : index;
      } while (!noParentsWithDisplayNone(inputs[index]))
      inputs[index].focus()
      if (event.type === 'keydown' && 
          (inputs[index].hasAttribute('linked-item'))) {
        let checkbox = inputs[index].parentElement.getElementsByClassName('selectable')[0];
        checkbox.classList.add('selected');
      }
      previousArrowTime = new Date();
    }
  }
  if (event.target.tagName.toLowerCase() != 'textarea' && event.type === 'keydown' && (event.target.hasAttribute('linked-item')) && ['Enter'].includes(event.key)) {
    let button = event.target.parentElement.getElementsByClassName('selectable')[0];
    button.click();
  }
  if (functionHandle) {
    functionHandle(event);
  }
  previousValue = event.target.value;
}
function noParentsWithDisplayNone(current) {
  while(current) {
    if (current.style.display == 'none' || current.classList.contains('hide')) {
      return false;
    }
    current = current.parentElement;
  }
  return true;
}
function blurEmulator(event) {
  let selecteds = Array.from(document.getElementsByClassName('selected'));
  selecteds.forEach(x=>x.classList.remove('selected'));
}
function applyEmulators(customCallback) {
  let allItems = Array.from(document.querySelectorAll(`[input-group-name]`));
  for (let i = 0; i < allItems.length; i++) {
    let item = allItems[i];
    if (item.hasAttribute('generated')) {
      continue;
    }
    if (item.tagName.toLowerCase() == 'textarea' || (item.tagName.toLowerCase() == 'input' && ['tel','number','text'].includes(item.type.toLowerCase()))) {
      item.addEventListener('keydown', (e)=>{arrowKeyEmulator(e, customCallback)});
      item.addEventListener('keyup', (e)=>{arrowKeyEmulator(e, customCallback)});
      item.setAttribute('generated', true);
      item.classList.add('navigable-input');
    } else {
      let invisibleInput = document.createElement('input');
      invisibleInput.type = 'text';
      invisibleInput.classList.add('invisible-input');
      invisibleInput.classList.add('navigable-input');
      invisibleInput.setAttribute('input-group-name', item.getAttribute('input-group-name'));
      invisibleInput.setAttribute('generated', true);
      invisibleInput.setAttribute('linked-item', true);
      invisibleInput.addEventListener('keydown', (e)=>{arrowKeyEmulator(e, customCallback)});
      invisibleInput.addEventListener('keyup', (e)=>{arrowKeyEmulator(e, customCallback)});
      invisibleInput.addEventListener('blur', blurEmulator);
      invisibleInput.tabIndex = '-1';

      item.parentElement.appendChild(invisibleInput);
      item.removeAttribute('input-group-name');
      item.classList.add('selectable');
    }
  }
}
function scrollToItem(domItem) {
  if (domItem.target) {
    domItem = domItem.target;
  }
  domItem.scrollIntoView({beharior: 'instant', block: 'nearest'});
  let topDiff = domItem.getBoundingClientRect().top - 80;
  if (topDiff < 0) {
    window.scrollBy(0, topDiff);
  } else {
    let bottomDiff = domItem.getBoundingClientRect().bottom - (window.innerHeight - 40);
    if (bottomDiff > 0) {
      window.scrollBy(0, bottomDiff);
    }
  }
}
applyEmulators(scrollToItem);