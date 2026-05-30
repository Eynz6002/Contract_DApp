// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RegistroCertificados {

    address public admin;

    struct DadosAluno {
        string nomeAluno;
        string matricula;
        string curso;
        string tipoCertificado;
        string campus;
        string cargaHoraria;
        string dataConclusao;
    }

    struct Certificado {
        bytes32    idDocumento;
        DadosAluno dados;
        uint256    dataEmissao;
        bool       isValido;
    }

    mapping(bytes32 => Certificado) private certificados;
    bytes32[] private listaDocumentos;

    event CertificadoEmitido(
        bytes32 indexed idDocumento,
        string  nomeAluno,
        string  curso,
        string  tipoCertificado,
        uint256 dataEmissao
    );

    modifier apenasAdmin() {
        require(msg.sender == admin, "Acesso restrito ao administrador.");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function emitirCertificado(
        bytes32             _idDocumento,
        DadosAluno calldata _dados
    ) external apenasAdmin {
        require(!certificados[_idDocumento].isValido,     "Certificado com este hash ja registrado.");
        require(bytes(_dados.nomeAluno).length > 0,       "Nome do aluno nao pode ser vazio.");
        require(bytes(_dados.matricula).length > 0,       "Matricula nao pode ser vazia.");
        require(bytes(_dados.curso).length > 0,           "Curso nao pode ser vazio.");
        require(bytes(_dados.tipoCertificado).length > 0, "Tipo de certificado nao pode ser vazio.");

        certificados[_idDocumento] = Certificado({
            idDocumento: _idDocumento,
            dados:       _dados,
            dataEmissao: block.timestamp,
            isValido:    true
        });
        listaDocumentos.push(_idDocumento);

        emit CertificadoEmitido(
            _idDocumento,
            _dados.nomeAluno,
            _dados.curso,
            _dados.tipoCertificado,
            block.timestamp
        );
    }

    function obterTodosOsHashes() external view returns (bytes32[] memory) {
        return listaDocumentos;
    }

    function verificarCertificado(bytes32 _idDocumento)
        external
        view
        returns (
            DadosAluno memory dados,
            uint256           dataEmissao,
            bool              isValido
        )
    {
        Certificado storage cert = certificados[_idDocumento];
        return (cert.dados, cert.dataEmissao, cert.isValido);
    }
}
