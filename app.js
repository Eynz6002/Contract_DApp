// Atualize com o endereço do contrato após reimplantar RegistroCertificados.sol
const CONTRACT_ADDRESS = "0x695A23a48f4D64B6f1f35FC3a18B935C9B0A5564";

// Componentes da struct DadosAluno — reutilizados em input e output da ABI
const _DADOS_COMPONENTS = [
  { "internalType": "string", "name": "nomeAluno", "type": "string" },
  { "internalType": "string", "name": "matricula", "type": "string" },
  { "internalType": "string", "name": "curso", "type": "string" },
  { "internalType": "string", "name": "tipoCertificado", "type": "string" },
  { "internalType": "string", "name": "campus", "type": "string" },
  { "internalType": "string", "name": "cargaHoraria", "type": "string" },
  { "internalType": "string", "name": "dataConclusao", "type": "string" }
];

const ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "idDocumento", "type": "bytes32" },
      { "indexed": false, "internalType": "string", "name": "nomeAluno", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "curso", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "tipoCertificado", "type": "string" },
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
      {
        "components": _DADOS_COMPONENTS,
        "internalType": "struct RegistroCertificados.DadosAluno",
        "name": "_dados",
        "type": "tuple"
      }
    ],
    "name": "emitirCertificado",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "obterTodosOsHashes",
    "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_idDocumento", "type": "bytes32" }],
    "name": "verificarCertificado",
    "outputs": [
      {
        "components": _DADOS_COMPONENTS,
        "internalType": "struct RegistroCertificados.DadosAluno",
        "name": "dados",
        "type": "tuple"
      },
      { "internalType": "uint256", "name": "dataEmissao", "type": "uint256" },
      { "internalType": "bool", "name": "isValido", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ─── Estado global ────────────────────────────────────────────────────────────
let provider = null;
let signer = null;
let contract = null;

// ─── Títulos por tipo de certificado ─────────────────────────────────────────
const TITULO_DIPLOMA = {
  "Tecnólogo": "DIPLOMA DE TECNÓLOGO",
  "Bacharelado": "DIPLOMA DE BACHAREL",
  "Licenciatura": "DIPLOMA DE LICENCIATURA",
  "Especialização": "CERTIFICADO DE ESPECIALIZAÇÃO",
  "Extensão": "CERTIFICADO DE EXTENSÃO",
  "Participação em Evento": "CERTIFICADO DE PARTICIPAÇÃO"
};

// ─── Utilitários ──────────────────────────────────────────────────────────────
function showStatus(elementId, message, type = "info") {
  const el = document.getElementById(elementId);
  if (!el) return;
  const colors = {
    info: "bg-blue-50 border-blue-400 text-blue-800",
    success: "bg-green-50 border-green-400 text-green-800",
    error: "bg-red-50 border-red-400 text-red-800",
    loading: "bg-yellow-50 border-yellow-400 text-yellow-800",
  };
  el.className = `border-l-4 p-4 rounded-lg text-sm ${colors[type] || colors.info}`;
  el.innerHTML = message;
  el.classList.remove("hidden");
}

function formatarTimestamp(ts) {
  return new Date(Number(ts) * 1000).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric"
  });
}

function formatarDataInput(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Conexão MetaMask ─────────────────────────────────────────────────────────
async function conectarMetaMask() {
  const btn = document.getElementById("btnConectar");

  if (!window.ethereum) {
    showStatus("statusConexao", "MetaMask não detectada. Instale a extensão para continuar.", "error");
    return;
  }
  if (!CONTRACT_ADDRESS) {
    showStatus("statusConexao", "Endereço do contrato não configurado em app.js.", "error");
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = "Conectando...";

    await window.ethereum.request({ method: "eth_requestAccounts" });

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      showStatus("statusConexao", "Rede incorreta. Conecte a carteira à Testnet Sepolia.", "error");
      btn.disabled = false;
      btn.textContent = "Conectar MetaMask";
      return;
    }

    const address = await signer.getAddress();
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    btn.textContent = `Conectado: ${short}`;
    btn.classList.replace("bg-blue-600", "bg-green-600");
    btn.classList.replace("hover:bg-blue-700", "hover:bg-green-700");

    document.getElementById("formEmissao").classList.remove("hidden");
    showStatus("statusConexao", "Carteira conectada com sucesso na Sepolia.", "success");
  } catch (err) {
    showStatus("statusConexao", `Erro ao conectar: ${err.message}`, "error");
    btn.disabled = false;
    btn.textContent = "Conectar MetaMask";
  }
}

// ─── Emissão de Certificado ───────────────────────────────────────────────────
async function emitirCertificado(event) {
  event.preventDefault();

  const hashDocRaw = document.getElementById("hashDocumento").value.trim();
  const nomeAluno = document.getElementById("nomeAluno").value.trim();
  const matricula = document.getElementById("matricula").value.trim();
  const curso = document.getElementById("curso").value.trim();
  const tipoCertificado = document.getElementById("tipoCertificado").value;
  const campus = document.getElementById("campus").value.trim();
  const cargaHoraria = document.getElementById("cargaHoraria").value.trim();
  const dataConclusao = document.getElementById("dataConclusao").value;

  if (!hashDocRaw || !nomeAluno || !matricula || !curso ||
    !tipoCertificado || !campus || !cargaHoraria || !dataConclusao) {
    showStatus("statusEmissao", "Preencha todos os campos antes de emitir.", "error");
    return;
  }

  let idDocumento;
  try {
    idDocumento = ethers.id(hashDocRaw);
  } catch {
    showStatus("statusEmissao", "Hash do documento inválido.", "error");
    return;
  }

  const btnEmitir = document.getElementById("btnEmitir");

  try {
    btnEmitir.disabled = true;
    btnEmitir.textContent = "Aguardando confirmação...";
    showStatus("statusEmissao", "Transação enviada. Aguardando mineração...", "loading");

    const dadosAluno = {
      nomeAluno,
      matricula,
      curso,
      tipoCertificado,
      campus,
      cargaHoraria,
      dataConclusao: formatarDataInput(dataConclusao)
    };
    const tx = await contract.emitirCertificado(idDocumento, dadosAluno);
    await tx.wait();

    const etherscanUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
    showStatus(
      "statusEmissao",
      `✅ Certificado emitido com sucesso!<br>
             <a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer"
                class="font-semibold underline hover:opacity-80 mt-1 inline-block">
               Ver transação no Etherscan →
             </a>`,
      "success"
    );
    document.getElementById("formEmissaoEl").reset();
    document.getElementById("campus").value = "IFPI - Campus Parnaíba";
  } catch (err) {
    const msg = err?.reason ?? err?.message ?? "Erro desconhecido.";
    showStatus("statusEmissao", `Erro ao emitir: ${msg}`, "error");
  } finally {
    btnEmitir.disabled = false;
    btnEmitir.textContent = "Emitir Certificado na Blockchain";
  }
}

// ─── Verificação e Diploma ────────────────────────────────────────────────────
async function verificarCertificado() {
  const hashDocRaw = document.getElementById("hashVerificacao").value.trim();
  const diplomaArea = document.getElementById("diplomaContainer");
  diplomaArea.classList.add("hidden");
  diplomaArea.innerHTML = "";

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
    btnVerificar.disabled = true;
    btnVerificar.textContent = "Consultando...";

    const readProvider = window.ethereum
      ? new ethers.BrowserProvider(window.ethereum)
      : ethers.getDefaultProvider("sepolia");
    const readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider);

    // Aceita hash original (string) ou bytes32 hex (0x...) vindo do Livro de Registro
    const idDocumento = /^0x[0-9a-fA-F]{64}$/.test(hashDocRaw)
      ? hashDocRaw
      : ethers.id(hashDocRaw);

    const [dados, dataEmissao, isValido] =
      await readContract.verificarCertificado(idDocumento);

    if (!isValido) {
      showStatus("statusVerificacao", "Nenhum certificado válido encontrado para este hash.", "error");
      return;
    }

    document.getElementById("statusVerificacao").classList.add("hidden");
    renderDiploma({
      nomeAluno: dados.nomeAluno,
      matricula: dados.matricula,
      curso: dados.curso,
      tipoCertificado: dados.tipoCertificado,
      campus: dados.campus,
      cargaHoraria: dados.cargaHoraria,
      dataConclusao: dados.dataConclusao,
      dataEmissao
    }, hashDocRaw);
  } catch (err) {
    const msg = err?.reason ?? err?.message ?? "Erro desconhecido.";
    showStatus("statusVerificacao", `Erro na consulta: ${msg}`, "error");
  } finally {
    btnVerificar.disabled = false;
    btnVerificar.textContent = "Verificar Autenticidade";
  }
}

function renderDiploma(data, hashDocRaw) {
  const { nomeAluno, matricula, curso, tipoCertificado,
    campus, cargaHoraria, dataConclusao, dataEmissao } = data;

  const titulo = TITULO_DIPLOMA[tipoCertificado] ?? tipoCertificado.toUpperCase();
  const dataEmissaoStr = formatarTimestamp(dataEmissao);
  const etherscanUrl = `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`;

  const html = `
    <div class="border-8 border-amber-700 p-2 rounded-xl shadow-2xl max-w-2xl mx-auto mt-6">
      <div class="border-2 border-amber-500 p-8 rounded-lg" style="background:#fffff8;">

        <!-- Cabeçalho Institucional -->
        <div class="text-center border-b-2 border-amber-400 pb-4 mb-5">
          <p class="text-xs text-slate-400 uppercase tracking-widest">
            República Federativa do Brasil &middot; Ministério da Educação
          </p>
          <p class="font-semibold text-blue-900 text-sm mt-1 leading-tight">
            Instituto Federal de Educação, Ciência e Tecnologia do Piauí
          </p>
          <p class="text-blue-700 text-xs mt-0.5">${campus}</p>
        </div>

        <!-- Tipo do Documento -->
        <div class="text-center my-5">
          <p class="font-bold uppercase text-blue-900 tracking-widest"
             style="font-family:'Playfair Display',Georgia,serif;font-size:1.6rem;letter-spacing:.18em;">
            ${titulo}
          </p>
        </div>

        <!-- Nome do Aluno -->
        <div class="text-center my-5">
          <p class="text-slate-500 italic text-sm">Certifica que</p>
          <p class="font-bold italic text-slate-800 my-2 leading-tight"
             style="font-family:'Playfair Display',Georgia,serif;font-size:2.5rem;">
            ${nomeAluno}
          </p>
          <p class="text-slate-400 text-xs">Matrícula: ${matricula}</p>
        </div>

        <!-- Curso e Detalhes -->
        <div class="text-center my-5 px-4">
          <p class="text-slate-500 italic text-sm">concluiu com êxito o curso de</p>
          <p class="font-bold text-lg text-blue-900 mt-1">${curso}</p>
          <div class="flex flex-wrap justify-center gap-x-6 mt-3 text-sm text-slate-600">
            <span>Carga horária: <strong>${cargaHoraria}</strong></span>
            <span>Conclusão: <strong>${dataConclusao}</strong></span>
          </div>
          <p class="text-xs text-slate-400 mt-1">Registrado na blockchain em ${dataEmissaoStr}</p>
        </div>

        <!-- Rodapé: Selo + QR Code -->
        <div class="flex items-end justify-between mt-6 pt-4 border-t border-amber-300">
          <div>
            <div class="flex items-center gap-1.5 text-green-700 font-semibold text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0
                         00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414
                         1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"/>
              </svg>
              Validado na Blockchain
            </div>
            <a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer"
               class="text-xs text-blue-600 hover:text-blue-800 underline mt-1 block transition-colors">
              Ver contrato no Etherscan →
            </a>
          </div>
          <div class="text-right">
            <div id="qrcodeEl"></div>
            <p class="text-xs text-slate-400 mt-1">Hash do Documento</p>
          </div>
        </div>

      </div>
    </div>`;

  const container = document.getElementById("diplomaContainer");
  container.innerHTML = html;
  container.classList.remove("hidden");

  if (typeof QRCode !== "undefined") {
    new QRCode(document.getElementById("qrcodeEl"), {
      text: hashDocRaw,
      width: 80,
      height: 80,
      colorDark: "#78350f",
      colorLight: "#fffff8"
    });
  }

  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Livro de Registro Público ────────────────────────────────────────────────
async function carregarLivroRegistro() {
  const tbody = document.getElementById("corpoTabela");
  const loadingEl = document.getElementById("livroLoading");
  const vazioEl = document.getElementById("livroVazio");

  if (!CONTRACT_ADDRESS) {
    if (loadingEl) loadingEl.classList.add("hidden");
    return;
  }

  try {
    const readProvider = window.ethereum
      ? new ethers.BrowserProvider(window.ethereum)
      : ethers.getDefaultProvider("sepolia");
    const readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider);

    const hashes = await readContract.obterTodosOsHashes();

    if (loadingEl) loadingEl.classList.add("hidden");

    if (hashes.length === 0) {
      if (vazioEl) vazioEl.classList.remove("hidden");
      return;
    }

    for (const hashBytes32 of hashes) {
      try {
        const [dados, dataEmissao, isValido] =
          await readContract.verificarCertificado(hashBytes32);
        if (!isValido) continue;

        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-100 hover:bg-slate-50 transition-colors";
        tr.innerHTML = `
                    <td class="py-3 px-4 text-xs font-semibold text-blue-700 whitespace-nowrap">
                        ${dados.tipoCertificado}
                    </td>
                    <td class="py-3 px-4">
                        <p class="font-medium text-slate-800 text-sm">${dados.nomeAluno}</p>
                        <p class="text-xs text-slate-400">Mat. ${dados.matricula}</p>
                    </td>
                    <td class="py-3 px-4 text-sm text-slate-600">${dados.curso}</td>
                    <td class="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        ${formatarTimestamp(dataEmissao)}
                    </td>
                    <td class="py-3 px-4">
                        <button onclick="visualizarDoRegistro('${hashBytes32}')"
                                class="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all
                                       text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                            Visualizar
                        </button>
                    </td>`;
        tbody.appendChild(tr);
      } catch {
        // Certificado pode ter sido invalidado — ignora silenciosamente
      }
    }
  } catch (err) {
    if (loadingEl) {
      loadingEl.textContent = "Não foi possível carregar o livro de registro.";
      loadingEl.className = "text-sm text-red-500 py-4 text-center";
      loadingEl.classList.remove("hidden");
    }
  }
}

function visualizarDoRegistro(hashBytes32) {
  const input = document.getElementById("hashVerificacao");
  input.value = hashBytes32;
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  verificarCertificado();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnConectar").addEventListener("click", conectarMetaMask);
  document.getElementById("formEmissaoEl").addEventListener("submit", emitirCertificado);
  document.getElementById("btnVerificar").addEventListener("click", verificarCertificado);

  document.getElementById("campus").value = "IFPI - Campus Parnaíba";

  carregarLivroRegistro();

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => location.reload());
    window.ethereum.on("chainChanged", () => location.reload());
  }
});
