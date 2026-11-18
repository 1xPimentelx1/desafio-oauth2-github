const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(express.static('public'));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


app.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Preencha nome, e-mail e senha.' });
        }

        // Criptografa a senha (salt rounds = 10)
        const senhaHash = await bcrypt.hash(senha, 10);

        const query = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
        await pool.query(query, [nome, email, senhaHash]);

        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
    } catch (erro) {
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
        }
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' });
    }
});


app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Informe e-mail e senha.' });
        }

        const [usuarios] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (usuarios.length === 0) {
            return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
        }

        const usuario = usuarios[0];

        // Compara a senha digitada com o hash salvo no banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
        }

        // Gera o token JWT válido por 1 hora
        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ mensagem: 'Login realizado!', token });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno ao fazer login.' });
    }
});


app.get('/perfil', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: 'Token não fornecido.' });
    }


    const token = authHeader.split(' ')[1];

    try {
        const dadosDecodificados = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ nome: dadosDecodificados.nome });
    } catch (erro) {
        return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});