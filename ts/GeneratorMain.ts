import Generator from './Generator'

const g : Generator = new Generator();
g.updateButtonsFromLocalStorage();
document.getElementById('text')?.addEventListener('input',g.queueSaveToLocalStorage);
document.getElementById('to-ascii')?.addEventListener('click',g.removeUnusualCharacters);
document.getElementById('add-bullets')?.addEventListener('click',g.bulletNewLinesWhereAppropriate);
document.getElementById('add-fields')?.addEventListener('click',g.addFields);
document.getElementById('generate')?.addEventListener('click',g.generateCallback);
document.getElementById('copy-local-storage')?.addEventListener('click',g.copyLocalStorage);