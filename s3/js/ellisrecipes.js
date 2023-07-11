let scrollPos = undefined;
function showRecipe(card) {
    scrollPos = window.scrollY;
    const wrapper = document.getElementById('wrapper');
    wrapper.style.display = 'none';
    for (const pin of card.getElementsByClassName('pin')) {
        pin.style.display = 'none';
    }
    const contentDiv = card.getElementsByTagName('div')[0];
    contentDiv.style.display = 'block';
    card.classList.add('fullscreen');
    const placeholder = document.createElement('div');
    placeholder.setAttribute('id', 'placeholder');
    card.parentElement?.insertBefore(placeholder, card);
    document.body.appendChild(card);
    window.scrollTo(0, 0);
    const title = card.getElementsByTagName('h3')[0].innerText.trim();
    document.title = title;
}
function showRecipeCallback(ev) {
    const card = ev.target.parentElement;
    showRecipe(card);
}
function closeRecipeCallback(ev) {
    if(ev.target instanceof HTMLButtonElement) {
        const contentDiv = ev.target.parentElement.parentElement ;
        const card = contentDiv.parentElement ;
        closeRecipe(card);
    }
}
function closeRecipes() {
    for(const card of document.getElementsByClassName('card')) {
        if(card.classList.contains('fullscreen')) {
            closeRecipe(card );
        }
    }
}
function closeRecipe(card) {
    const wrapper = document.getElementById('wrapper') ;
    wrapper.style.display = '';
    const contentDiv = card.getElementsByTagName('div')[0];
    for (const pin of card.getElementsByClassName('pin')) {
        (pin ).style.display = '';
    }
    contentDiv.style.display = 'none';
    card.classList.remove('fullscreen');
    const placeholder = document.getElementById('placeholder') ;
    placeholder.parentElement?.insertBefore(card, placeholder);
    placeholder.remove();
    window.scrollTo(0, scrollPos);
    document.title = 'Ellis Recipes';
}



const allHeaders = Array.from(document.getElementsByClassName('title'));
for (let header of allHeaders) {
    header.addEventListener('click', showRecipeCallback);
}
const allCloses = Array.from(document.getElementsByClassName('close-recipe'));
for (let closer of allCloses) {
    closer.addEventListener('click', closeRecipeCallback);
}