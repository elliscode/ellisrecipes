# Setup

Create virtual environment:

```
python -m venv env
```

Activate virtual environment:

```
cd env/Scripts/ && . activate && cd ../../
```

Install requirements:

```
pip install -r requirements.txt
```

Compile Typescript:

```
tsc
```

Collect static files:

```
python manage.py collectstatic
```

Run WSGI server:

```
python server.py
```

# Cache and secrets folder layout

- `$HOME/ellisrecipes`
    - `secret-key.txt` &mdash; automatically generated on the startup of the server, see `/elliscodedotcom/settings.py`