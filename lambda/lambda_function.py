import boto3
import re
from html import escape

BUCKET_NAME = 'daniel-townsend-ellisrecipes'
PROCESSING_FILE_NAME = '.processing'
s3 = boto3.client('s3')
temp_path = '/tmp/index.html'


def lambda_handler(event, context):
    if does_s3_file_exist(bucket=BUCKET_NAME, key=PROCESSING_FILE_NAME):
        return {
            'statusCode': 200,
            'body': 'Looks like we\'re already processing, skipping...',
        }
    
    write_processing_file(bucket=BUCKET_NAME)

    standard_categories = [
        'Meals',
        'Sides',
        'Snacks',
        'Soups',
        'Dips And Sauces',
        'Drinks',
        'Desserts',
        'Ingredients',
        'Baby Food',
        'Household',
    ]
    
    print(f'Generating keys for grouped_text dict...')
    grouped_text = {}
    for category in standard_categories:
        grouped_text[category] = []
    print(f'Finished generating keys for grouped_text dict!')
    
    print(f'Fetching all files from the {BUCKET_NAME}/markdown/ directory...')
    files = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix='markdown/')
    for file in files.get('Contents', []):
        recipe_text, category = generate_recipe_text(file)
        if category not in grouped_text:
            grouped_text[category] = []
        grouped_text[category].append(recipe_text)
    print(f'Finished fetching all files from the {BUCKET_NAME}/markdown/ directory!')
    
    print(f'Writing file to {temp_path}...')
    with open(temp_path, 'w') as f:
        f.write('''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ellis Recipes</title>
    <meta name="description" content="Adaptations of recipes found on the internet">
    <meta name="author" content="elliscode.com">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/png" href="img/favicon.png">
    <link rel="stylesheet" href="css/stylesheet.css">
    <link rel="stylesheet" href="css/loader.css">
    <link rel="stylesheet" href="css/responsive.css">
    <noscript>
        <link rel="stylesheet" href="css/noscript.css" />
    </noscript>
    <!-- <script type="text/javascript" src="js/main_RecipeFormattingMain.js"></script> -->
    <!-- <script type="text/javascript" src="js/script.js"></script> -->
    <!-- <script type="text/javascript" src="js/nosleep.js"></script> -->
</head>
<body id="body">
    <div id="wrapper">
        <h1>Ellis Recipes</h1>
        <div id="option-buttons" style="display: block;">
            <img id="set-screen-lock" class="screen-lock-off" src="img/transparent.png" alt="Set screen lock">
        </div>
        <div id="search-group" style="display: block;">
            <input type="text" id="search" placeholder="Search...">
            <button id="search-clear">&times;</button>
        </div>
        <div id="recipes" style="display: block;">
            <!-- recipe divs -->''')
        for category, recipe_list in grouped_text.items():
            f.write(f'<h2>{category}</h2>\n')
            for recipe in recipe_list:
                f.write(recipe)
        f.write('''
            <!-- end recipe divs -->
        </div>
    </div>
    <div id="info">
        <p>text copied</p>
    </div>
    <script src="js/ellisrecipes.js"></script>
</body>
</html>''')
    print(f'Finished writing file to {temp_path}!')
    
    print(f'Copying {temp_path} file to {BUCKET_NAME}/index.html...')
    with open(temp_path, 'r') as f:
        s3.put_object(
            Bucket=BUCKET_NAME, 
            Key='index.html', 
            Body=f.read().encode('utf-8'), 
            # SourceFile='/tmp/index.html',
            ContentType='text/html',
        )
    print(f'Finished copying {temp_path} file to {BUCKET_NAME}/index.html!')

    delete_processing_file(bucket=BUCKET_NAME)

    return {
        'statusCode': 200,
        'body': 'Successfully completed the generation ellisrecipes index file',
    }
    
    
def generate_recipe_text(file):
    in_list = False
    key = file['Key']
    title = file['Key']
    servings = '1'
    category = 'Uncategorized'
    link = ''
    tags = []
    content = ''
    data = s3.get_object(Bucket=BUCKET_NAME, Key=file['Key'])
    lines = data['Body'].read().decode('utf-8').splitlines()
    for line in lines:
        line = escape(line.strip())
        if len(line) == 0:
            continue
        if not line.startswith('-') and in_list:
            content += f'</ul>'
            in_list = False
        if line.startswith('# '):
            text = line.strip('# ')
            title = f'{text}'
        elif line.startswith('## '):
            text = line.strip('# ')
            content += f'<h4>{text}</h4>'
        elif line.startswith('### '):
            text = line.strip('# ')
            content += f'<h5>{text}</h5>'
        elif line.startswith('#### '):
            text = line.strip('# ')
            content += f'<h6>{text}</h6>'
        elif line.startswith('Servings:'):
            servings = line[9:].strip()
        elif line.startswith('Category:'):
            category = line[9:].strip()
        elif line.startswith('Link:'):
            link = line[5:].strip()
        elif line.startswith('Tags:'):
            text = line[5:].strip()
            for item in text.split(','):
                tags.append(item.strip())
        else:
            if line.startswith('-'):
                if not in_list:
                    content += f'<ul>'
                in_list = True
                text = line.strip('- ')
            else:
                text = line.strip()
            text = re.sub(r'`([0-9/\.\s]+)`', r'<span originalvalue="\1" class="quantity">\1</span>', text)
            if in_list:
                content += f'<li>{text}</li>'
            else:
                content += f'<p>{text}</p>'
    div_id = re.sub(r'[^a-zA-Z0-9]+', '_', category.upper() + '_' + title.upper())
    serving_string =  f'<div class="servings">'
    serving_string += f'<label>Servings: </label>'
    serving_string += f'<input type="text" originalvalue="{servings}" inputmode="decimal">'
    serving_string += f'<img class="reset" src="img/reset.png" related="{div_id}">'
    serving_string += f'<img class="halve" src="img/divide_by_two.png" related="{div_id}">'
    serving_string += f'<img class="double" src="img/times_two.png" related="{div_id}">'
    serving_string += f'</div>'
    close = '<div class="close-div"><button class="close-recipe">&times;</button></div>'
    output =  f'<div class="card" id="{div_id}" servings="{servings}">'
    output += f'<h3 class="title">{title}</h3>'
    output += f'<div style="display:none; position: relative; padding-bottom: 50px;">'
    output += f'{serving_string}'
    output += f'{content}'
    output += f'{close}'
    output += f'<a href="{key}"><img class="copy" src="img/copy.png" related="{div_id}"></a><img class="reddit" src="img/reddit_button.png" related="{div_id}"><img class="cronometer" src="img/cronometer_button.png" related="{div_id}"><img class="ellis" src="img/print.png" related="{div_id}"><img class="share" src="img/share_button.png" related="{div_id}">'
    if link:
        output += f'<a class="source" href="{link}"><img class="link" src="img/link.png"></a>'
    output += f'<div class="category" style="display: none;">Meals</div>'
    if len(tags) > 0:
        output += f'<div class="tags">'
        for tag in tags:
            output += f'<span class="tag">{tag}</span>'
        output += f'</div>'
    output += f'</div>'
    output += f'<div class="pindragimg green"></div>'
    output += f'\n</div>'
    return output, category


def does_s3_file_exist(bucket: str, key: str):
    return 'Contents' in s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=PROCESSING_FILE_NAME)


def write_processing_file(bucket: str):
    s3.put_object(
        Bucket=bucket, 
        Key=PROCESSING_FILE_NAME,
        Body='',
    )



def delete_processing_file(bucket: str):
    s3.delete_object(
        Bucket=bucket, 
        Key=PROCESSING_FILE_NAME,
    )
