// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RegistroCertificados {

    address public admin;

    struct Certificado {
        bytes32 idDocumento;
        string  nomeAluno;
        string  curso;
        uint256 dataEmissao;
        bool    isValido;
    }

    mapping(bytes32 => Certificado) private certificados;

    event CertificadoEmitido(
        bytes32 indexed idDocumento,
        string  nomeAluno,
        string  curso,
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
        bytes32 _idDocumento,
        string  calldata _nomeAluno,
        string  calldata _curso
    ) external apenasAdmin {
        require(
            !certificados[_idDocumento].isValido,
            "Certificado com este hash ja registrado."
        );
        require(bytes(_nomeAluno).length > 0, "Nome do aluno nao pode ser vazio.");
        require(bytes(_curso).length > 0,     "Curso nao pode ser vazio.");

        certificados[_idDocumento] = Certificado({
            idDocumento: _idDocumento,
            nomeAluno:   _nomeAluno,
            curso:       _curso,
            dataEmissao: block.timestamp,
            isValido:    true
        });

        emit CertificadoEmitido(_idDocumento, _nomeAluno, _curso, block.timestamp);
    }

    function verificarCertificado(bytes32 _idDocumento)
        external
        view
        returns (
            string  memory nomeAluno,
            string  memory curso,
            uint256        dataEmissao,
            bool           isValido
        )
    {
        Certificado storage cert = certificados[_idDocumento];
        return (cert.nomeAluno, cert.curso, cert.dataEmissao, cert.isValido);
    }
}
