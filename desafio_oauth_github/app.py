import os
import secrets
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv
from flask import Flask, redirect, render_template, request, session, url_for

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(32))
CLIENT_ID = os.getenv('GITHUB_CLIENT_ID', '')
CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET', '')

@app.route('/')
def index():
    return render_template('index.html', usuario=session.get('usuario'), configurado=bool(CLIENT_ID and CLIENT_SECRET))

@app.route('/login')
def login():
    if not CLIENT_ID or not CLIENT_SECRET:
        return 'Configure GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET no arquivo .env.', 500
    state = secrets.token_urlsafe(32)
    session['oauth_state'] = state
    params = urlencode({'client_id': CLIENT_ID, 'redirect_uri': url_for('callback', _external=True), 'state': state, 'scope': 'read:user'})
    return redirect('https://github.com/login/oauth/authorize?' + params)

@app.route('/callback')
def callback():
    state = session.pop('oauth_state', None)
    if not state or not secrets.compare_digest(state, request.args.get('state', '')):
        return 'Estado de autenticação inválido.', 400
    if request.args.get('error'):
        return 'Autorização recusada.', 400
    code = request.args.get('code')
    if not code:
        return 'Código de autorização ausente.', 400
    try:
        token_resp = requests.post('https://github.com/login/oauth/access_token', data={'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET, 'code': code, 'redirect_uri': url_for('callback', _external=True)}, headers={'Accept': 'application/json'}, timeout=15)
        token_resp.raise_for_status()
        token = token_resp.json().get('access_token')
        if not token:
            return 'Não foi possível obter o token de acesso.', 400
        user_resp = requests.get('https://api.github.com/user', headers={'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json'}, timeout=15)
        user_resp.raise_for_status()
        user = user_resp.json()
    except (requests.RequestException, ValueError):
        return 'Erro ao comunicar com o GitHub.', 502
    session['usuario'] = {'nome': user.get('name') or user.get('login'), 'login': user.get('login'), 'avatar': user.get('avatar_url'), 'perfil': user.get('html_url')}
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
