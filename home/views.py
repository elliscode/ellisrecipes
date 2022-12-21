import os
import re
from collections import OrderedDict

from django.shortcuts import render

from ellisrecipes.settings import BASE_DIR
from home.markdown_helpers import MarkdownElement

# I don't like using a global variable like this, but I cannot figure
# out how to get a singleton with the index view to work in django
recipes = None


def format_id(input_text):
    return re.sub('[^a-zA-Z0-9]+', '_', input_text, ).strip('_')


def read_from_file():
    results = {}
    ul = []
    markdown_directory = BASE_DIR / 'markdown'
    for filename in os.listdir(markdown_directory):
        f = os.path.join(markdown_directory, filename)
        if os.path.isfile(f) and filename.endswith('.md'):
            recipe = {'markdown': []}
            with open(f, mode='r') as file:
                for line in file:
                    line = line.strip()
                    if not line:
                        continue
                    element = MarkdownElement(line)
                    if element.type == 'li':
                        ul.append(element)
                    else:
                        if ul:
                            recipe['markdown'].append(ul)
                            ul = []
                        if element.type == 'h1':
                            if recipe['markdown']:
                                id_string = (recipe['category'] + ' ' + recipe['title'])
                                recipe['id'] = format_id(id_string)
                                if recipe['category'] not in results:
                                    results[recipe['category']] = []
                                results[recipe['category']].append(recipe)
                            recipe = {'markdown': [],
                                      'id': '',
                                      'title': element.content[0].value,
                                      'servings': 1,
                                      'category': 'Uncategorized',
                                      'link': '',
                                      'tags': [], }
                            recipe['markdown'].append(element)
                        elif element.type == 'p' and element.content[0].value.startswith('Servings: '):
                            recipe['servings'] = element.content[0].value[10:]
                        elif element.type == 'p' and element.content[0].value.startswith('Category: '):
                            recipe['category'] = element.content[0].value[10:]
                        elif element.type == 'p' and element.content[0].value.startswith('Link: '):
                            recipe['link'] = element.content[0].value[6:]
                        elif element.type == 'p' and element.content[0].value.startswith('Tags: '):
                            recipe['tags'] = re.split('\\s*,\\s*', element.content[0].value[6:])
                        else:
                            recipe['markdown'].append(element)
            if recipe['markdown']:
                id_string = (recipe['category'] + ' ' + recipe['title'])
                recipe['id'] = format_id(id_string)
                if recipe['category'] not in results:
                    results[recipe['category']] = []
                results[recipe['category']].append(recipe)
    output = OrderedDict()
    ordered_categories = determine_category_order(results)
    for category in ordered_categories:
        output[category] = results[category]
    return output


def write_to_file(markdowns):
    markdown_directory = BASE_DIR / 'markdown'
    for markdown in markdowns:
        title = markdown[0].value.content
        file_path = markdown_directory / (title + '.md')
        with open(file_path, 'w') as f:
            for line in markdown:
                if not hasattr(line, 'type'):
                    for li in line:
                        f.write(li.prefix)
                        f.write(li.content)
                        f.write('\n')
                    f.write('\n')
                else:
                    f.write(line.prefix)
                    f.write(line.content)
                    f.write('\n\n')


def determine_category_order(markdowns):
    all_categories = markdowns.keys()
    forced_order = ["Meals", "Sides", "Snacks", "Soups", "Dips And Sauces", "Drinks", "Desserts", "Cheese", "Baby Food",
                    "Household", ];
    output = forced_order
    for category in all_categories:
        if category not in output:
            output.append(category)
    return output


# Create your views here.
def index(request):
    global recipes
    if recipes is None:
        recipes = read_from_file()
    return render(request, 'home/index.html',
                  context={'recipes': recipes, })
