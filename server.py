from waitress import serve

from ellisrecipes.wsgi import application

if __name__ == '__main__':
    serve(application, port='8003')