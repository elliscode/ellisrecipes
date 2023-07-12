let scrollPos = undefined;
function showRecipe(card) {
    scrollPos = window.scrollY;
    const wrapper = document.getElementById('wrapper');
    wrapper.style.display = 'none';
    const pins = Array.from(card.getElementsByClassName('pin'));
    for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        pin.style.display = 'none';
    }
    const contentDiv = card.getElementsByTagName('div')[0];
    contentDiv.style.display = 'block';
    card.classList.add('fullscreen');
    const placeholder = document.createElement('div');
    placeholder.setAttribute('id', 'placeholder');
    card.parentElement.insertBefore(placeholder, card);
    document.body.appendChild(card);
    setTimeout(()=>{ window.scrollTo(0, 0) }, 10);
    const title = card.getElementsByTagName('h3')[0].innerText.trim();
    document.title = title;
}
function showRecipeCallback(ev) {
    if (ev.target.tagName.toLowerCase() == 'h3') {
        const card = ev.target.parentElement;
        showRecipe(card);
        const cardId = card.id;
        window.removeEventListener('hashchange', showRecipeInUrl);
        history.replaceState("", "", window.location.pathname + window.location.search + '#' + cardId);
        window.addEventListener('hashchange', showRecipeInUrl);
    }
}
function closeRecipeCallback(ev) {
    if(ev.target instanceof HTMLButtonElement) {
        const contentDiv = ev.target.parentElement.parentElement ;
        const card = contentDiv.parentElement ;
        closeRecipe(card);
    }
    window.removeEventListener('hashchange', showRecipeInUrl);
    history.replaceState("", "", window.location.pathname + window.location.search);
    window.addEventListener('hashchange', showRecipeInUrl);
}
function closeRecipes() {
    const cards = Array.from(document.getElementsByClassName('card'));
    for(let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if(card.classList.contains('fullscreen')) {
            closeRecipe(card );
        }
    }
}
function closeRecipe(card) {
    const wrapper = document.getElementById('wrapper') ;
    wrapper.style.display = '';
    const contentDiv = card.getElementsByTagName('div')[0];
    const pins = Array.from(card.getElementsByClassName('pin'));
    for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        pin.style.display = '';
    }
    contentDiv.style.display = 'none';
    card.classList.remove('fullscreen');
    const placeholder = document.getElementById('placeholder') ;
    placeholder.parentElement.insertBefore(card, placeholder);
    placeholder.remove();
    window.scrollTo(0, scrollPos);
    document.title = 'Ellis Recipes';
}
function searchBackend(search) {
    scheduleSaveSearch();
    const hides = Array.from(document.getElementsByClassName('hide'));
    for (let i = 0; i < hides.length; i++) {
        const element = hides[i];
        element.classList.remove('hide');
    }
    const searchValue = search.value;
    if (!searchValue) {
        return;
    }
    const searchTexts = searchValue.toLowerCase().split(/\s+/).filter(Boolean);
    const recipesDiv = document.getElementById('recipes');
    let previousGroup = undefined;
    let anyShownInGroup = false;
    const children = Array.from(recipesDiv.children);
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.tagName.toLowerCase() == 'h2') {
            if (previousGroup && !anyShownInGroup) {
                previousGroup.classList.add('hide');
            }
            const group = child;
            previousGroup = group;
            anyShownInGroup = false;
        } else if (child.tagName.toLowerCase() == 'div' && child.classList.contains('card')) {
            const card = child;
            const textContent = card.textContent.toLocaleLowerCase();
            let findCount = 0;
            for (let j = 0; j < searchTexts.length; j++) {
                const searchText = searchTexts[j];
                if (textContent.includes(searchText.toLowerCase())) {
                    findCount++;
                }
            }
            if (findCount == searchTexts.length) {
                anyShownInGroup = true;
            } else {
                card.classList.add('hide');
            }
        }
    }
    if (previousGroup && !anyShownInGroup) {
        previousGroup.classList.add('hide');
    }
}
function executeSearch(ev) {
    const search = ev.target;
    searchBackend(search);
}
function clearSearch(ev) {
    const searchElement = document.getElementById('search');
    const search = searchElement;
    search.value = '';
    searchBackend(search);
}
let saveSearchCallback = undefined;
function scheduleSaveSearch() {
    clearTimeout(saveSearchCallback);
    saveSearchCallback = setTimeout(saveSearchToLocalStorage, 1000);
}
function saveSearchToLocalStorage() {
    const search = document.getElementById('search');
    window.localStorage.setItem('ellis-recipes-search-term', search.value);
}
function loadSearchTermFromLocalStorage() {
    const searchTerm = window.localStorage.getItem('ellis-recipes-search-term');
    if (searchTerm) {
        const search = document.getElementById('search');
        search.value = searchTerm;
        searchBackend(search);
    }
}
function showRecipeInUrl() {
    const cardId = decodeURIComponent(window.location.hash.substring(1));
    closeRecipes();
    if (!!cardId) {
        const card = document.getElementById(cardId);
        if (!!card) {
            card.classList.remove('hide');
            showRecipe(card);
        }
    }
    window.addEventListener('hashchange', showRecipeInUrl);
}
function addCallback(selector, eventType, func) {
    let items = Array.from(document.querySelectorAll(selector));
    if (!items) {
        items = [];
    }
    for(let i = 0; i < items.length; i++) {
        let item = items[i];
        item.addEventListener(eventType, func);
    }
}
function modifyRecipe(card, multiplier) {
    const quantities = Array.from(card.getElementsByClassName('quantity'));
    for (let i = 0; i < quantities.length; i++) {
        const quantity = quantities[i];
        let ogValue = quantity.getAttribute('originalValue');
        if(!ogValue) {
            ogValue = '1';
        }
        let computedValue  = 0;
        const result = /(\d+)\/(\d+)/.exec(ogValue);
        if(result) {
            computedValue = (parseFloat(result[1]) / parseFloat(result[2])) * multiplier;
        } else {
            computedValue = parseFloat(ogValue) * multiplier;
        }
        (quantity ).innerText = toFractionIfApplicable(computedValue);
    }
}
function toFractionIfApplicable(value) {
    const roundedValue  = Math.round(value * 1e5) / 1e5;
    if(fractionMap.has(roundedValue)) {
        return fractionMap.get(roundedValue);
    }
    let output = roundedValue.toString();
    if (output.includes('.') && output.length > 6) {
        output = roundedValue.toFixed(4);
    }
    return output;
}
function modifyRecipeByCallback(ev) {
    const input = (ev.target );
    const card = input.parentElement.parentElement.parentElement ;
    let numerator = parseFloat(input.value);
    const denominator = parseFloat(card.getAttribute('servings'));
    if (isNaN(numerator)) {
        numerator = denominator;
    }
    modifyRecipe(card, numerator / denominator);
}
function resetRecipe(ev) {
    const card = (ev.target ).parentElement.parentElement.parentElement ;
    const input = card.getElementsByTagName('input')[0];
    const denominator = parseFloat(card.getAttribute('servings'));
    const numerator = denominator;
    modifyRecipe(card, numerator / denominator);
    input.value = numerator.toString();
}
function halveRecipe(ev) {
    const card = (ev.target ).parentElement.parentElement.parentElement ;
    const input = card.getElementsByTagName('input')[0];
    let numerator = parseFloat(input.value);
    const denominator = parseFloat(card.getAttribute('servings'));
    if (isNaN(numerator)) {
        numerator = denominator;
    }
    numerator = numerator / 2;
    modifyRecipe(card, numerator / denominator);
    input.value = numerator.toString();
}
function doubleRecipe(ev) {
    const card = (ev.target ).parentElement.parentElement.parentElement ;
    const input = card.getElementsByTagName('input')[0];
    let numerator = parseFloat(input.value);
    const denominator = parseFloat(card.getAttribute('servings'));
    if (isNaN(numerator)) {
        numerator = denominator;
    }
    numerator = numerator * 2;
    modifyRecipe(card, numerator / denominator);
    input.value = numerator.toString();
}
const fractionMap = new Map();
for(let i = 2; i <= 64; i++) {
    for(let j = 1; j < i; j++) {
        const roundedValue = Math.round((j / i) * 1e5)/1e5;
        if(fractionMap.has(roundedValue)) {
            continue;
        }
        const fractionString = j.toString() + '/' + i.toString();
        fractionMap.set(roundedValue, fractionString);
    }
}
function printRecipe(ev) {
    window.print();
}
function shareRecipe(ev) {
    const card = (ev.target).parentElement.parentElement;
    const text = 'https://www.ellisrecipes.com/#' + card.id;
    navigator.clipboard.writeText(text);
    displayAlert('Copied link for ' + card.getElementsByTagName('h3')[0].textContent + ' to clipboard', ['lightgreen']);
}
let copyTimeout = undefined;
function displayAlert(alertText, cssClasses) {
    const info = document.getElementById('info');
    info.style.display = 'inline-block';
    info.innerText = alertText;
    const existingCssClasses = Array.from(info.classList);
    for (let i = 0; i < existingCssClasses.length; i++) {
        const cssClass = existingCssClasses[i];
        info.classList.remove(cssClass);
    }
    for (let i = 0; i < cssClasses.length; i++) {
        const classToAdd = cssClasses[i];
        info.classList.add(classToAdd);
    }
    startGradualFade(info, copyTimeout);
}
let timeout = undefined;
function startGradualFade(element, timeout) {
    element.style.opacity = '1';
    clearTimeout(timeout);
    timeout = setTimeout(gradualFade, 1500, element, timeout);
};
function gradualFade(element, timeout) {
    const newVal = parseFloat(element.style.opacity) - 0.01;
    if (newVal > 0) {
        element.style.opacity = newVal.toString();
        timeout = setTimeout(gradualFade, 10, element, timeout);
    } else {
        element.style.display = 'none';
        timeout = undefined;
    }
};
addCallback('h3.title', 'click', showRecipeCallback);
addCallback('button.close-recipe', 'click', closeRecipeCallback);
addCallback('input[originalvalue]', 'input', modifyRecipeByCallback);
const servingInputs = Array.from(document.querySelectorAll('input[originalvalue]'));
for (let i = 0; i < servingInputs.length; i++) {
    let servingInput = servingInputs[i];
    servingInput.value = servingInput.getAttribute('originalvalue');
}
addCallback('input#search', 'input', executeSearch);
addCallback('button#search-clear', 'click', clearSearch);
addCallback('img.reset', 'click', resetRecipe);
addCallback('img.halve', 'click', halveRecipe);
addCallback('img.double', 'click', doubleRecipe);
addCallback('img.ellis', 'click', printRecipe);
addCallback('img.share', 'click', shareRecipe);
loadSearchTermFromLocalStorage();
showRecipeInUrl();