import os
import re

from django.shortcuts import render

from ellisrecipes.settings import BASE_DIR
from home.markdown_helpers import MarkdownElement


def format_id(input_text):
    return re.sub('[^a-z0-9]+', '_', input_text, ).strip('_')


# Create your views here.
def index(request):
    markdowns = []
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
                                markdowns.append(recipe)
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
                markdowns.append(recipe)

    # for markdown in markdowns:
    #     title = markdown[0].value.content
    #     file_path = markdown_directory / (title + '.md')
    #     with open(file_path, 'w') as f:
    #         for line in markdown:
    #             if not hasattr(line, 'type'):
    #                 for li in line:
    #                     f.write(li.prefix)
    #                     f.write(li.content)
    #                     f.write('\n')
    #                 f.write('\n')
    #             else:
    #                 f.write(line.prefix)
    #                 f.write(line.content)
    #                 f.write('\n\n')

    return render(request, 'home/index.html', context={'recipes': markdowns, })
