# Desafio OAuth 2.0 — Login com GitHub

Aplicação Flask que utiliza o fluxo OAuth 2.0 Authorization Code para autenticar com GitHub e exibir nome, usuário, foto e link do perfil.

## Configuração

1. No GitHub, abra **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Preencha **Application name**: `Desafio OAuth2`.
3. Preencha **Homepage URL**: `http://127.0.0.1:5000`.
4. Preencha **Authorization callback URL**: `http://127.0.0.1:5000/callback`.
5. Registre o aplicativo e gere um **Client Secret**.
6. Copie `.env.example` para `.env` e substitua os valores de `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` e `FLASK_SECRET_KEY`.

## Executar

```bash
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Acesse `http://127.0.0.1:5000` e clique em **Entrar com GitHub**.

## Funcionamento

1. A aplicação redireciona o usuário para a autorização do GitHub.
2. O GitHub retorna um código temporário para `/callback`.
3. O servidor troca o código por um token de acesso.
4. A aplicação consulta `https://api.github.com/user` e mostra os dados retornados.
5. O usuário pode encerrar a sessão clicando em **Sair**.

**Segurança:** o Client Secret fica somente no servidor, no arquivo `.env` (não versionado); o parâmetro `state` é validado para reduzir riscos de CSRF. Para implantação pública, configure HTTPS, uma chave secreta fixa e desative `debug`.
