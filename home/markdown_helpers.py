class MarkdownElement:
    type: str
    prefix: str
    content: str

    def __str__(self):
        return 'type: ' + self.type + ' content: ' + self.content

    def __init__(self, line: str):
        if line.startswith('# '):
            self.type = 'h1'
            self.content = line[2:]
            self.prefix = '# '
        elif line.startswith('## '):
            self.type = 'h2'
            self.content = line[3:]
            self.prefix = '## '
        elif line.startswith('### '):
            self.type = 'h3'
            self.content = line[4:]
            self.prefix = '### '
        elif line.startswith('#### '):
            self.type = 'h4'
            self.content = line[5:]
            self.prefix = '##### '
        elif line.startswith('- '):
            self.type = 'li'
            self.content = line[2:]
            self.prefix = '- '
        # elif line.startswith('Servings: '):
        #     self.type = 'servings'
        #     self.content = line[10:]
        # elif line.startswith('Category: '):
        #     self.type = 'category'
        #     self.content = line[10:]
        # elif line.startswith('Link: '):
        #     self.type = 'link'
        #     self.content = line[6:]
        # elif line.startswith('Tags: '):
        #     self.type = 'tags'
        #     self.content = line[6:]
        else:
            self.type = 'p'
            self.content = line
            self.prefix = ''
