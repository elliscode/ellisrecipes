import re


class Content:
    item_type: str
    value: str

    def __str__(self):
        return 'type: ' + self.item_type + ' value: ' + self.value

    def __init__(self, _type: str, _value: str):
        self.item_type = _type
        self.value = _value


def parse(line: str) -> list[Content]:
    output = []
    for part in line.split('`'):
        determined_type = 'string'
        if re.match('\\d+\\.*\\d*|[\\d+/\\d+]]', part):
            determined_type = 'number'
        output.append(Content(determined_type, part))
    return output


class MarkdownElement:
    type: str
    prefix: str
    content: list[Content]

    def __str__(self):
        return 'type: ' + self.type + ' content: ' + self.content

    def __init__(self, line: str):
        if line.startswith('# '):
            self.type = 'h1'
            self.content = parse(line[2:])
            self.prefix = '# '
        elif line.startswith('## '):
            self.type = 'h2'
            self.content = parse(line[3:])
            self.prefix = '## '
        elif line.startswith('### '):
            self.type = 'h3'
            self.content = parse(line[4:])
            self.prefix = '### '
        elif line.startswith('#### '):
            self.type = 'h4'
            self.content = parse(line[5:])
            self.prefix = '##### '
        elif line.startswith('- '):
            self.type = 'li'
            self.content = parse(line[2:])
            self.prefix = '- '
        else:
            self.type = 'p'
            self.content = parse(line)
            self.prefix = ''
