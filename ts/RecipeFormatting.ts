import Link from './Link'
import Category from './Category'
import Servings from './Servings'
import Tags from './Tags'
import Title from './Title'
import RecipeCard from './RecipeCard'
import Timeout from './Timeout'
import NoSleep from './nosleep';
import Utilities from './Utilities';

export default class RecipeFormatting {
    readonly ACCEPT_WIDTH: number = 40;
    readonly MARGIN: number = 10;

    readonly recipesMap: Map<string, Map<string, RecipeCard>> = new Map();
    startX: number | undefined = undefined;
    prevDiff: number | undefined = undefined;
    saveSearchCallback: Timeout = new Timeout();
    scrollPos: number = 0;
    copyTimeout: Timeout = new Timeout();
    noSleep : NoSleep = new NoSleep();
    screenLockOption : boolean = false;

    readonly fractionMap : Map<number, string> = new Map();

    constructor () {
        for(let i = 2; i <= 64; i++) {
            for(let j = 1; j < i; j++) {
                const roundedValue = Math.round((j / i) * 1e5)/1e5;
                if(this.fractionMap.has(roundedValue)) {
                    continue;
                }
                const fractionString : string = j.toString() + '/' + i.toString();
                this.fractionMap.set(roundedValue, fractionString);
            }
        }
    }

    readonly touchy = (event: TouchEvent) => {
        const touch = event.touches[0];
        if (!this.startX) {
            this.startX = touch.clientX
        }
    };
    readonly touchy2 = (event: TouchEvent) => {
        const multiplier : number = 5;
        let xdiff = Math.abs(Math.min(0, event.touches[0].clientX - this.startX!));
        if (xdiff > this.MARGIN) {
            if (event.cancelable) {
                event.preventDefault();
            } else {
                xdiff = 0;
            }
        } else {
            xdiff = 0;
        }
        if(xdiff > this.ACCEPT_WIDTH) {
            let remainder = xdiff - this.ACCEPT_WIDTH;
            xdiff = this.ACCEPT_WIDTH + Math.sqrt(remainder);
        }
        this.prevDiff = xdiff;
        const card: HTMLElement = ((event.target as HTMLElement).parentElement as HTMLElement);
        card.style.left = '-' + xdiff + 'px';
        const pinDragImg = card.getElementsByClassName('pindragimg')[0] as HTMLDivElement;
        pinDragImg.style.right = '-' + xdiff + 'px';
        pinDragImg.style.opacity = Math.min(xdiff / this.ACCEPT_WIDTH, 1).toString();
    }
    readonly touchy3 = (event: TouchEvent) => {
        const card = (event.target as HTMLHeadingElement).parentElement as HTMLDivElement;
        if (Math.abs(this.prevDiff!) > this.ACCEPT_WIDTH) {
            this.pinRecipe(event);
        }
        card.style.left = '0px';
        const pinDragImg = card.getElementsByClassName('pindragimg')[0] as HTMLDivElement;
        pinDragImg.style.right = 0 + 'px';
        this.startX = undefined;
        this.prevDiff = undefined;
    }
    readonly touchy4 = (event: TouchEvent) => {
        const card = (event.target as HTMLHeadingElement).parentElement as HTMLDivElement;
        if (Math.abs(this.prevDiff!) > this.ACCEPT_WIDTH) {
            this.unpinRecipe(event);
        }
        card.style.left = '0px';
        const pinDragImg = card.getElementsByClassName('pindragimg')[0] as HTMLDivElement;
        pinDragImg.style.right = 0 + 'px';
        this.startX = undefined;
        this.prevDiff = undefined;
    }
    static readonly addCallback = (selector: string, func: EventListenerOrEventListenerObject) => {
        let items = Array.from(document.querySelectorAll(selector));
        if (!items) {
            items = [];
        }
        for(let item of items) {
            item.addEventListener('click', func);
        }
    }

    readonly addCallbacks = () => {
        RecipeFormatting.addCallback('h3.title', this.showRecipeCallback);
        RecipeFormatting.addCallback('button.close-recipe', this.closeRecipeCallback);
        RecipeFormatting.addCallback('img.reset', this.resetRecipe);
        RecipeFormatting.addCallback('img.halve', this.halveRecipe);
        RecipeFormatting.addCallback('img.double', this.doubleRecipe);
        RecipeFormatting.addCallback('img.copy', this.copyRecipe);
        RecipeFormatting.addCallback('img.reddit', this.copyMarkdown);
        RecipeFormatting.addCallback('img.cronometer', this.copyCronometer);
        RecipeFormatting.addCallback('img.ellis', this.printRecipe);
        RecipeFormatting.addCallback('img.share', this.shareRecipe);

        let headers : HTMLHeadingElement[] = Array.from(document.querySelectorAll('h3.title'));
        for(let header2 of headers) {
            header2.addEventListener('touchstart', this.touchy, { passive: true });
            header2.addEventListener('touchmove', this.touchy2, { passive: false });
            header2.addEventListener('touchend', this.touchy3, { passive: true });
        }

        let items : HTMLInputElement[] = Array.from(document.querySelectorAll('input[originalvalue]'));
        if (!items) {
            items = [];
        }
        for(let item of items) {
            item.value = item.hasAttribute('originalvalue') ? item.getAttribute('originalvalue')! : '';
        }

        const searchTextBox = document.getElementById('search');
        searchTextBox?.addEventListener('input', this.executeSearch);

        const searchClearButton = document.getElementById('search-clear');
        searchClearButton?.addEventListener('click', this.clearSearch);

        const setScreenLockButton = document.getElementById('set-screen-lock');
        setScreenLockButton?.addEventListener('click', this.toggleScreenLock);
    }
    readonly executeSearch = (ev: Event) => {
        const search: HTMLInputElement = (ev.target as HTMLInputElement);
        this.searchBackend(search);
    }
    readonly clearSearch = (ev: Event) => {
        const searchElement = document.getElementById('search');
        const search: HTMLInputElement = (searchElement as HTMLInputElement);
        search.value = '';
        this.searchBackend(search);
    }
    readonly scheduleSaveSearch = () => {
        clearTimeout(this.saveSearchCallback.value);
        this.saveSearchCallback.value = setTimeout(this.saveSearchToLocalStorage, 1000);
    }
    readonly saveSearchToLocalStorage = () => {
        const search: HTMLInputElement = document.getElementById('search') as HTMLInputElement;
        window.localStorage.setItem('ellis-recipes-search-term', search.value);
    }
    readonly loadSearchTermFromLocalStorage = () => {
        const searchTerm: string | null = window.localStorage.getItem('ellis-recipes-search-term');
        if (searchTerm) {
            const search: HTMLInputElement = document.getElementById('search') as HTMLInputElement;
            search.value = searchTerm;
            this.searchBackend(search);
        }
    }
    readonly searchBackend = (search: HTMLInputElement): void => {
        this.scheduleSaveSearch();
        for (const element of Array.from(document.getElementsByClassName('hide'))) {
            element.classList.remove('hide');
        }
        const searchValue: string = search.value;
        if (!searchValue) {
            return;
        }
        const searchTexts: string[] = searchValue.toLowerCase().split(/\s+/).filter(Boolean);

        const recipesDiv = document.getElementById('recipes') as HTMLDivElement;
        let previousGroup: HTMLHeadingElement | undefined = undefined;
        let anyShownInGroup: boolean = false;
        for (const child of recipesDiv.children) {
            if (child instanceof HTMLHeadingElement) {
                if (previousGroup && !anyShownInGroup) {
                    previousGroup.classList.add('hide');
                }
                const group: HTMLHeadingElement = child as HTMLHeadingElement;
                previousGroup = group;
                anyShownInGroup = false;
            } else if (child instanceof HTMLDivElement && child.classList.contains('card')) {
                const card: HTMLDivElement = child as HTMLDivElement;
                const textContent: string = card.textContent!.toLocaleLowerCase();
                let findCount: number = 0;
                for (const searchText of searchTexts) {
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
    readonly modifyRecipe = (card: HTMLDivElement, multiplier: number) => {
        for (const quantity of card.getElementsByClassName('quantity')) {
            const newValue: number = parseFloat(quantity.getAttribute('originalValue')!) * multiplier;
            (quantity as HTMLSpanElement).innerText = this.toFractionIfApplicable(newValue);
        }
    }
    readonly toFractionIfApplicable = (value: number): string => {
        const roundedValue : number = Math.round(value * 1e5) / 1e5;
        if(this.fractionMap.has(roundedValue)) {
            return this.fractionMap.get(roundedValue)!;
        }
        let output = roundedValue.toString();
        if (output.includes('.') && output.length > 6) {
            output = roundedValue.toFixed(4);
        }
        return output;
    }

    readonly modifyRecipeByCallback = (ev: Event) => {
        const input: HTMLInputElement = (ev.target as HTMLInputElement);
        const card: HTMLDivElement = input.parentElement?.parentElement?.parentElement as HTMLDivElement;
        let numerator = parseFloat(input.value);
        const denominator: number = parseFloat(card.getAttribute('servings')!);
        if (isNaN(numerator)) {
            numerator = denominator;
        }
        this.modifyRecipe(card, numerator / denominator);
    }
    readonly resetRecipe = (ev: Event) => {
        const card: HTMLDivElement = (ev.target as HTMLElement).parentElement?.parentElement?.parentElement as HTMLDivElement;
        const input: HTMLInputElement = card.getElementsByTagName('input')[0];
        const denominator: number = parseFloat(card.getAttribute('servings')!);
        const numerator: number = denominator;
        this.modifyRecipe(card, numerator / denominator);
        input.value = numerator.toString();
    }
    readonly halveRecipe = (ev: Event) => {
        const card: HTMLDivElement = (ev.target as HTMLElement).parentElement?.parentElement?.parentElement as HTMLDivElement;
        const input: HTMLInputElement = card.getElementsByTagName('input')[0];
        let numerator: number = parseFloat(input.value);
        const denominator: number = parseFloat(card.getAttribute('servings')!);
        if (isNaN(numerator)) {
            numerator = denominator;
        }
        numerator = numerator / 2;
        this.modifyRecipe(card, numerator / denominator);
        input.value = numerator.toString();
    }
    readonly doubleRecipe = (ev: Event) => {
        const card: HTMLDivElement = (ev.target as HTMLElement).parentElement?.parentElement?.parentElement as HTMLDivElement;
        const input: HTMLInputElement = card.getElementsByTagName('input')[0];
        let numerator: number = parseFloat(input.value);
        const denominator: number = parseFloat(card.getAttribute('servings')!);
        if (isNaN(numerator)) {
            numerator = denominator;
        }
        numerator = numerator * 2;
        this.modifyRecipe(card, numerator / denominator);
        input.value = numerator.toString();
    }
    static readonly getCardTitle = (card : HTMLDivElement) : string => {
        for(const h of card.getElementsByTagName('h3')) {
            return h.innerText.trim();
        }
        return '';
    }
    readonly showRecipeCallback = (ev: Event) => {
        if(ev.target instanceof HTMLHeadingElement) {    
            const card: HTMLDivElement = (ev.target as HTMLHeadingElement).parentElement! as HTMLDivElement;
            this.showRecipe(card);
            const title : string = RecipeFormatting.getCardTitle(card);
            const sanitizedTitle:string = Utilities.sanitizeTitle(title);
            window.removeEventListener('hashChange', this.showRecipeInUrl);
            history.replaceState("", "", window.location.pathname + window.location.search + '#' + sanitizedTitle);
            window.addEventListener('hashchange', this.showRecipeInUrl);
        }
    }
    readonly showRecipe = (card : HTMLDivElement) => {
        if (this.screenLockOption) { 
            this.noSleep.enable();
        }
        this.scrollPos = window.scrollY;
        const wrapper: HTMLDivElement = document.getElementById('wrapper') as HTMLDivElement;
        wrapper.style.display = 'none';
        for (const pin of card.getElementsByClassName('pin')) {
            (pin as HTMLElement).style.display = 'none';
        }
        const contentDiv: HTMLDivElement = card.getElementsByTagName('div')[0];
        contentDiv.style.display = 'block';
        card.classList.add('fullscreen');
        const placeholder = document.createElement('div');
        placeholder.setAttribute('id', 'placeholder');
        card.parentElement?.insertBefore(placeholder, card);
        document.body.appendChild(card);
        window.scrollTo(0, 0);
        const title:string = card.getElementsByTagName('h3')[0].innerText.trim();
        document.title = title;
    }
    readonly showRecipeInUrl = () => {
        const recipeTitle = decodeURIComponent(window.location.hash.substring(1));
        this.closeRecipes();
        if(recipeTitle) {
            const sanitizedRecipeTitle = Utilities.sanitizeTitle(recipeTitle);
            for(const hItem of document.getElementsByTagName('h3')) {
                const sanitizedHeader = Utilities.sanitizeTitle(hItem.innerText);
                if(sanitizedHeader == sanitizedRecipeTitle) {
                    const card: HTMLDivElement = (hItem as HTMLHeadingElement).parentElement! as HTMLDivElement;
                    this.showRecipe(card);
                    break;
                }
            }
        }
        window.addEventListener('hashchange', this.showRecipeInUrl);
    }
    readonly closeRecipeCallback = (ev: Event) => {
        if(ev.target instanceof HTMLButtonElement) {
            const contentDiv: HTMLDivElement = ((ev.target as HTMLButtonElement).parentElement as HTMLElement).parentElement as HTMLDivElement;
            const card: HTMLDivElement = contentDiv.parentElement as HTMLDivElement;
            this.closeRecipe(card);
        }
        window.removeEventListener('hashChange', this.showRecipeInUrl);
        history.replaceState("", "", window.location.pathname + window.location.search);
        window.addEventListener('hashchange', this.showRecipeInUrl);
    }
    readonly closeRecipes = () => {
        for(const card of document.getElementsByClassName('card')) {
            if(card.classList.contains('fullscreen')) {
                this.closeRecipe(card as HTMLDivElement);
            }
        }
    }
    readonly closeRecipe = (card : HTMLDivElement) => {
        this.noSleep.disable();
        const wrapper: HTMLDivElement = document.getElementById('wrapper') as HTMLDivElement;
        wrapper.style.display = '';
        const contentDiv: HTMLDivElement = card.getElementsByTagName('div')[0];
        for (const pin of card.getElementsByClassName('pin')) {
            (pin as HTMLElement).style.display = '';
        }
        contentDiv.style.display = 'none';
        card.classList.remove('fullscreen');
        const placeholder: HTMLDivElement = document.getElementById('placeholder') as HTMLDivElement;
        placeholder.parentElement?.insertBefore(card, placeholder);
        placeholder.remove();
        window.scrollTo(0, this.scrollPos);
        document.title = 'Ellis Recipes';
    }
    readonly shareRecipe = (ev: Event) => {
        const card: HTMLDivElement = (ev.target as HTMLElement).parentElement?.parentElement as HTMLDivElement;
        const title : string = RecipeFormatting.getCardTitle(card);
        const text = 'https://ellisrecipes.com/#' + Utilities.sanitizeTitle(title);
        navigator.clipboard.writeText(text);
        this.displayAlert('Copied link for ' + card.getElementsByTagName('h3')[0].textContent + ' to clipboard', 'lightgreen');
    }
    readonly copyRecipe = (ev: Event) => {
        const card: HTMLDivElement = (ev.target as HTMLElement).parentElement?.parentElement as HTMLDivElement;
        const text = this.convertRecipeToMarkdown(card, 'plain');
        navigator.clipboard.writeText(text);
        this.displayAlert('Copied ' + card.getElementsByTagName('h3')[0].textContent + ' to clipboard', 'lightgreen');
    }
    readonly copyMarkdown = (ev: Event) => {
        const card: HTMLDivElement = (ev.target as HTMLElement).parentElement?.parentElement as HTMLDivElement;
        const text = this.convertRecipeToMarkdown(card, 'markdown');
        navigator.clipboard.writeText(text);
        this.displayAlert('Copied ' + card.getElementsByTagName('h3')[0].textContent + ' to clipboard', 'lightgreen');
    }
    readonly copyCronometer = (ev : Event) => {
        const card: HTMLDivElement = (ev.target as HTMLElement).parentElement?.parentElement as HTMLDivElement;
        const text = this.convertRecipeToMarkdown(card, 'cronometer');
        navigator.clipboard.writeText(text);
        this.displayAlert('Copied ' + card.getElementsByTagName('h3')[0].textContent + ' to clipboard', 'lightgreen');
    }
    readonly displayAlert = (alertText: string, ...cssClasses: string[]) => {
        const info: HTMLElement = document.getElementById('info') as HTMLElement;
        info.style.display = 'inline-block';
        info.innerText = alertText;
        for (const cssClass of Array.from(info.classList)) {
            info.classList.remove(cssClass);
        }
        for (const classToAdd of cssClasses) {
            info.classList.add(classToAdd);
        }
        RecipeFormatting.startGradualFade(info, this.copyTimeout);
    }
    static readonly startGradualFade = (element: HTMLElement, timeout: Timeout) : void => {
        element.style.opacity = '1';
        clearTimeout(timeout.value);
        timeout.value = setTimeout(RecipeFormatting.gradualFade, 1500, element, timeout);
    };
    static readonly gradualFade = (element: HTMLElement, timeout: Timeout) => {
        const newVal = parseFloat(element.style.opacity) - 0.01;
        if (newVal > 0) {
            element.style.opacity = newVal.toString();
            timeout.value = setTimeout(RecipeFormatting.gradualFade, 10, element, timeout);
        } else {
            element.style.display = 'none';
            timeout.value = undefined;
        }
    };
    readonly convertRecipeToMarkdown = (card: HTMLDivElement, type: string): string => {

        let output = '';

        const titleItem: HTMLHeadingElement = card.getElementsByTagName('h3')[0];

        const markdown = 'markdown' == type;
        const ingredientsOnly = 'cronometer' == type;

        if(!ingredientsOnly) {
            output += (markdown ? '# ' : '') + titleItem.textContent + '\n' + '\n';
        }

        const contentDiv: HTMLDivElement = card.getElementsByTagName('div')[0];

        let linkUrl: string = '';
        let servings: string = '';
        let category: string = '';
        let tags: string = '';
        for (const child of contentDiv.children) {
            if (!ingredientsOnly && child instanceof HTMLHeadingElement) {
                if ('h4' === child.tagName.toLowerCase()) {
                    output += (markdown ? '## ' : '');
                } else if ('h5' === child.tagName.toLowerCase()) {
                    output += (markdown ? '### ' : '');
                } else if ('h4' === child.tagName.toLowerCase()) {
                    output += (markdown ? '#### ' : '');
                }
                output += child.textContent!.trim() + '\n' + '\n';
            } else if (child instanceof HTMLUListElement) {
                const ul: HTMLUListElement = child as HTMLUListElement;
                for (const listChild of ul.children) {
                    if (listChild instanceof HTMLLIElement) {
                        const lineContent = (ingredientsOnly ? '' : '- ') + listChild.textContent!.replace(/[\s\r\n]+/g, ' ').trim();
                        if(/^[0-9].*$/.exec(lineContent) || !ingredientsOnly) {
                            output += lineContent + '\n';
                        }
                    }
                }
                if(!ingredientsOnly) {
                    output += '\n';
                }
            } else if (!ingredientsOnly && child instanceof HTMLParagraphElement) {
                output += child.textContent!.trim() + '\n' + '\n';
            } else if (!ingredientsOnly && child instanceof HTMLAnchorElement) {
                const link: HTMLAnchorElement = child as HTMLAnchorElement;
                linkUrl = link.href;
            } else if (!ingredientsOnly && child instanceof HTMLDivElement) {
                if (child.classList.contains('servings')) {
                    servings = child.getElementsByTagName('input')[0].value;
                } else if (child.classList.contains('category')) {
                    category = child.innerText;
                } else if (child.classList.contains('tags')) {
                    for (const span of child.getElementsByTagName('span')) {
                        if (tags) {
                            tags += ", ";
                        }
                        tags += span.innerText;
                    }
                }
            }
        }

        if (servings && markdown) {
            output += "Servings: " + servings + "\n";
        }
        if (category && markdown) {
            output += "Category: " + category + "\n";
        }
        if (linkUrl) {
            output += (markdown ? "Link: " : '') + linkUrl + "\n";
        }
        if (tags && markdown) {
            output += "Tags: " + tags + "\n";
        }

        return output.trim();
    }
    readonly printRecipe = (ev: Event) => {
        window.print();
    }
    readonly pinRecipe = (ev: Event) => {
        let card: HTMLDivElement | undefined = undefined;
        let current = ev.target as HTMLElement;
        while (current) {
            if (current instanceof HTMLDivElement) {
                const div: HTMLDivElement = current as HTMLDivElement;
                if (div.classList.contains('card')) {
                    card = div;
                    break;
                }
            }
            current = current.parentElement as HTMLElement;
        }
        if (card) {
            const pinImg: HTMLImageElement = card.getElementsByClassName('pindragimg')[0] as HTMLImageElement;
            this.pinRecipeBackend(pinImg, card);
            this.addToPinsMemory(card.id);

            const header2: HTMLHeadingElement = card.getElementsByTagName('h3')[0] as HTMLHeadingElement;
            header2.removeEventListener('touchstart', this.touchy);
            header2.removeEventListener('touchmove', this.touchy2);
            header2.removeEventListener('touchend', this.touchy3);
            header2.addEventListener('touchstart', this.touchy, { passive: true });
            header2.addEventListener('touchmove', this.touchy2, { passive: false });
            header2.addEventListener('touchend', this.touchy4, { passive: true });

            this.displayAlert('Pinned ' + header2.textContent! + ' to top of page!', 'lightgreen');
        }
    }
    readonly pinRecipeBackend = (pinImg: HTMLImageElement, card: HTMLDivElement) => {
        const placeholderId = 'p' + card.id;
        if (!document.getElementById(placeholderId)) {
            const placeholder = document.createElement('div');
            placeholder.setAttribute('id', placeholderId);
            placeholder.style.display = 'none';
            card.parentElement?.insertBefore(placeholder, card);
        }
        card.parentElement?.insertBefore(card, card.parentElement.firstChild);
        if (pinImg) {
            pinImg.classList.remove('green');
            pinImg.classList.add('red');
        }
    }
    readonly unpinRecipe = (ev: Event) => {
        let card: HTMLDivElement | undefined = undefined;
        let current = ev.target as HTMLElement;
        while (current) {
            if (current instanceof HTMLDivElement) {
                const div: HTMLDivElement = current as HTMLDivElement;
                if (div.classList.contains('card')) {
                    card = div;
                    break;
                }
            }
            current = current.parentElement as HTMLElement;
        }
        if (card) {
            const pinImg: HTMLImageElement = card.getElementsByClassName('pindragimg')[0] as HTMLImageElement;
            this.unpinRecipeBackend(pinImg, card);
            this.removeFromPinsMemory(card.id);

            const header2: HTMLHeadingElement = card.getElementsByTagName('h3')[0] as HTMLHeadingElement;
            header2.removeEventListener('touchstart', this.touchy);
            header2.removeEventListener('touchmove', this.touchy2);
            header2.removeEventListener('touchend', this.touchy4);
            header2.addEventListener('touchstart', this.touchy, { passive: true });
            header2.addEventListener('touchmove', this.touchy2, { passive: false });
            header2.addEventListener('touchend', this.touchy3, { passive: true });

            this.displayAlert('Removed ' + header2.textContent! + ' from pinned group!', 'lightred');
        }
    }
    readonly unpinRecipeBackend = (pinImg: HTMLImageElement, card: HTMLDivElement) => {
        const placeholder: HTMLElement = document.getElementById('p' + card.id)!;
        card.parentElement?.insertBefore(card, placeholder);
        placeholder.remove();
        if (pinImg) {
            pinImg.classList.remove('red');
            pinImg.classList.add('green');
        }
    }
    readonly loadPinsFromMemory = () => {
        let output: string[] = [];
        const savedPinsString: string | null = window.localStorage.getItem('ellis-recipes-pins');
        if (savedPinsString) {
            const parseResult = JSON.parse(savedPinsString);
            if (parseResult instanceof Array) {
                output = parseResult as Array<string>;
            }
        }
        return output;
    }
    readonly addToPinsMemory = (id: string) => {
        let savedPins: string[] = this.loadPinsFromMemory();
        if (savedPins.indexOf(id) == -1) {
            savedPins.push(id);
        }
        window.localStorage.setItem('ellis-recipes-pins', JSON.stringify(savedPins));
    }
    readonly removeFromPinsMemory = (id: string) => {
        let savedPins: string[] = this.loadPinsFromMemory();
        let index: number = savedPins.indexOf(id);
        while (index > -1) {
            savedPins.splice(index, 1);
            index = savedPins.indexOf(id);
        }
        window.localStorage.setItem('ellis-recipes-pins', JSON.stringify(savedPins));
    }
    readonly loadAndSetPinsFromLocalStorage = () => {
        let savedPins: string[] = this.loadPinsFromMemory();
        for (const savedPin of savedPins) {
            const card: HTMLDivElement = document.getElementById(savedPin) as HTMLDivElement;
            if (card) {
                const pinImg: HTMLImageElement = card.getElementsByClassName('pindragimg')[0] as HTMLImageElement;
                this.pinRecipeBackend(pinImg, card);

                const header2: HTMLHeadingElement = card.getElementsByTagName('h3')[0] as HTMLHeadingElement;
                header2.removeEventListener('touchstart', this.touchy);
                header2.removeEventListener('touchmove', this.touchy2);
                header2.removeEventListener('touchend', this.touchy3);
                header2.addEventListener('touchstart', this.touchy, { passive: true });
                header2.addEventListener('touchmove', this.touchy2, { passive: false });
                header2.addEventListener('touchend', this.touchy4, { passive: true });
            }
        }
    }

    readonly toggleScreenLock = () => {
        const setScreenLockButton = document.getElementById('set-screen-lock');
        if(this.screenLockOption) {
            this.screenLockOption = false;
            setScreenLockButton?.classList.remove('screen-lock-on');
            setScreenLockButton?.classList.add('screen-lock-off');
        } else {
            this.screenLockOption = true;
            setScreenLockButton?.classList.remove('screen-lock-off');
            setScreenLockButton?.classList.add('screen-lock-on');
        }
    }
}