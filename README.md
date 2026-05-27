# 🎓 DApp Registro de Certificados - IFPI (Grupo 07)

Projeto da disciplina de Tópicos Especiais em Computação - Blockchain. 

## 📌 Pré-requisitos para testar
1. Navegador web (Chrome, Brave, Firefox, etc).
2. Extensão **MetaMask** instalada e configurada para a rede de testes **Sepolia**.
3. Saldo fictício de SepoliaETH na carteira (pode ser obtido no Faucet do Google Cloud).

## 🚀 Como executar o projeto localmente

Como este é um DApp (Aplicação Descentralizada) que interage com a carteira do navegador via `window.ethereum`, você não pode simplesmente abrir o arquivo `index.html` com dois cliques. Ele precisa rodar através de um servidor local.

**Opção 1: Usando Node.js (via Terminal)**
1. Abra o terminal na pasta do projeto.
2. Execute o comando: `npx serve .`
3. Abra o link gerado (geralmente `http://localhost:3000`) no navegador.

**Opção 2: Usando Python (via Terminal)**
1. Abra o terminal na pasta do projeto.
2. Execute: `python3 -m http.server 8000`
3. Acesse `http://localhost:8000` no navegador.

**Opção 3: Usando VSCode (Extensão)**
1. Abra a pasta do projeto no VSCode.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.

## 🧪 Testando as Funcionalidades
* **Consulta (Qualquer pessoa):** Copie o hash de um certificado já emitido e cole na área "Verificação Pública" para atestar a funcionalidade de leitura gratuita do contrato.
* **Emissão (Apenas Admin):** O contrato restringe a emissão de novos certificados à carteira que realizou o deploy. Caso deseje testar a emissão, solicite a transferência do controle administrativo ou peça para o desenvolvedor principal realizar a transação.