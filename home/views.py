import os

from django.shortcuts import render

from ellisrecipes.settings import BASE_DIR
from home.markdown_helpers import MarkdownElement


# Create your views here.
def index(request):
    markdowns = []
    ul = []
    markdown_directory = BASE_DIR / 'markdown'
    for filename in os.listdir(markdown_directory):
        f = os.path.join(markdown_directory, filename)
        if os.path.isfile(f) and filename.endswith('.md'):
            markdown = []
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
                            markdown.append(ul)
                            ul = []
                        if element.type == 'h1':
                            if markdown:
                                markdowns.append(markdown)
                            markdown = []
                        markdown.append(element)
            if markdown:
                markdowns.append(markdown)

    # for markdown in markdowns:
    #     title = markdown[0].content
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
