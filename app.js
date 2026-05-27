// Preencha com o endereço do contrato após o deploy na Sepolia
const CONTRACT_ADDRESS = "";

const ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "bytes32", "name": "idDocumento", "type": "bytes32" },
      { "indexed": false, "internalType": "string",  "name": "nomeAluno",   "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "curso",       "type": "string"  },
      { "indexed": false, "internalType": "uint256", "name": "dataEmissao", "type": "uint256" }
    ],
    "name": "CertificadoEmitido",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_idDocumento", "type": "bytes32" },
      { "internalType": "string",  "name": "_nomeAluno",   "type": "string"  },
      { "internalType": "string",  "name": "_curso",       "type": "string"  }
    ],
    "name": "emitirCertificado",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_idDocumento", "type": "bytes32" }],
    "name": "verificarCertificado",
    "outputs": [
      { "internalType": "string",  "name": "nomeAluno",   "type": "string"  },
      { "internalType": "string",  "name": "curso",       "type": "string"  },
      { "internalType": "uint256", "name": "dataEmissao", "type": "uint256" },
      { "internalType": "bool",    "name": "isValido",    "type": "bool"    }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ─── Estado global ───────────────────────────────────────────────────────────
let provider = null;
let signer   = null;
let contract = null;

// ─── Utilitários ─────────────────────────────────────────────────────────────
function showStatus(elementId, message, type = "info") {
  const el = document.getElementById(elementId);
  if (!el) return;
  const colors = {
    info:    "bg-blue-50 border-blue-400 text-blue-800",
    success: "bg-green-50 border-green-400 text-green-800",
    error:   "bg-red-50 border-red-400 text-red-800",
    loading: "bg-yellow-50 border-yellow-400 text-yellow-800",
  };
  el.className = `border-l-4 p-4 rounded-lg text-sm ${colors[type] || colors.info}`;
  el.textContent = message;
  el.classList.remove("hidden");
}

function formatTimestamp(ts) {
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// ─── Conexão MetaMask ─────────────────────────────────────────────────────────
async function conectarMetaMask() {
  const btn    = document.getElementById("btnConectar");
  const status = document.getElementById("statusConexao");

  if (!window.ethereum) {
    showStatus("statusConexao", "MetaMask não detectada. Instale a extensão para continuar.", "error");
    return;
  }

  if (!CONTRACT_ADDRESS) {
    showStatus("statusConexao", "Endereço do contrato não configurado em app.js.", "error");
    return;
  }

  try {
    btn.disabled    = true;
    btn.textContent = "Conectando...";

    await window.ethereum.request({ method: "eth_requestAccounts" });

    provider = new ethers.BrowserProvider(window.ethereum);
    signer   = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      showStatus("statusConexao", "Rede incorreta. Conecte a carteira à Testnet Sepolia.", "error");
      btn.disabled    = false;
      btn.textContent = "Conectar MetaMask";
      return;
    }

    const address = await signer.getAddress();
    const short   = `${address.slice(0, 6)}...${address.slice(-4)}`;

    btn.textContent = `Conectado: ${short}`;
    btn.classList.replace("bg-blue-600", "bg-green-600");
    btn.classList.replace("hover:bg-blue-700", "hover:bg-green-700");

    document.getElementById("formEmissao").classList.remove("hidden");
    showStatus("statusConexao", `Carteira conectada com sucesso na Sepolia.`, "success");
  } catch (err) {
    showStatus("statusConexao", `Erro ao conectar: ${err.message}`, "error");
    btn.disabled    = false;
    btn.textContent = "Conectar MetaMask";
  }
}

// ─── Emissão de Certificado ───────────────────────────────────────────────────
async function emitirCertificado(event) {
  event.preventDefault();

  const nomeAluno   = document.getElementById("nomeAluno").value.trim();
  const curso       = document.getElementById("curso").value.trim();
  const hashDocRaw  = document.getElementById("hashDocumento").value.trim();
  const statusEl    = "statusEmissao";

  if (!nomeAluno || !curso || !hashDocRaw) {
    showStatus(statusEl, "Preencha todos os campos antes de emitir.", "error");
    return;
  }

  let idDocumento;
  try {
    idDocumento = ethers.id(hashDocRaw);
  } catch {
    showStatus(statusEl, "Hash do documento inválido.", "error");
    return;
  }

  const btnEmitir = document.getElementById("btnEmitir");

  try {
    btnEmitir.disabled    = true;
    btnEmitir.textContent = "Aguardando confirmação...";
    showStatus(statusEl, "Transação enviada. Aguardando mineração...", "loading");

    const tx = await contract.emitirCertificado(idDocumento, nomeAluno, curso);
    await tx.wait();

    showStatus(
      statusEl,
      `Certificado emitido com sucesso! Hash da transação: ${tx.hash}`,
      "success"
    );
    document.getElementById("formEmissaoEl").reset();
  } catch (err) {
    const msg = err?.reason ?? err?.message ?? "Erro desconhecido.";
    showStatus(statusEl, `Erro ao emitir certificado: ${msg}`, "error");
  } finally {
    btnEmitir.disabled    = false;
    btnEmitir.textContent = "Emitir Certificado na Blockchain";
  }
}

// ─── Verificação Pública ──────────────────────────────────────────────────────
async function verificarCertificado() {
  const hashDocRaw = document.getElementById("hashVerificacao").value.trim();
  const resultEl   = document.getElementById("resultadoVerificacao");

  resultEl.classList.add("hidden");

  if (!hashDocRaw) {
    showStatus("statusVerificacao", "Informe o hash do documento para verificar.", "error");
    return;
  }

  if (!CONTRACT_ADDRESS) {
    showStatus("statusVerificacao", "Endereço do contrato não configurado em app.js.", "error");
    return;
  }

  const btnVerificar = document.getElementById("btnVerificar");

  try {
    btnVerificar.disabled    = true;
    btnVerificar.textContent = "Consultando...";

    if (!provider) {
      provider = new ethers.BrowserProvider(window.ethereum ?? ethers.getDefaultProvider("sepolia"));
    }
    const readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const idDocumento = ethers.id(hashDocRaw);
    const [nomeAluno, curso, dataEmissao, isValido] =
      await readContract.verificarCertificado(idDocumento);

    if (!isValido) {
      showStatus("statusVerificacao", "Nenhum certificado válido encontrado para este hash.", "error");
      return;
    }

    document.getElementById("res-nome").textContent    = nomeAluno;
    document.getElementById("res-curso").textContent   = curso;
    document.getElementById("res-data").textContent    = formatTimestamp(dataEmissao);
    document.getElementById("res-status").textContent  = "Válido";
    document.getElementById("res-status").className    = "font-semibold text-green-600";

    resultEl.classList.remove("hidden");
    document.getElementById("statusVerificacao").classList.add("hidden");
  } catch (err) {
    const msg = err?.reason ?? err?.message ?? "Erro desconhecido.";
    showStatus("statusVerificacao", `Erro na consulta: ${msg}`, "error");
  } finally {
    btnVerificar.disabled    = false;
    btnVerificar.textContent = "Verificar Autenticidade";
  }
}

// ─── Listeners ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnConectar").addEventListener("click", conectarMetaMask);
  document.getElementById("formEmissaoEl").addEventListener("submit", emitirCertificado);
  document.getElementById("btnVerificar").addEventListener("click", verificarCertificado);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => location.reload());
    window.ethereum.on("chainChanged",    () => location.reload());
  }
});
