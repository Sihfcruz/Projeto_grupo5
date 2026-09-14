CREATE DATABASE IF NOT EXISTS nomade;
USE nomade;


CREATE TABLE cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL UNIQUE,
    nivel_acesso INT NOT NULL
) ENGINE=InnoDB;


CREATE TABLE funcionario (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    id_cargo INT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,          
    deleted_at DATETIME NULL DEFAULT NULL,        
    CONSTRAINT fk_funcionario_cargo 
        FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE produto (
    codigo_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome_produto VARCHAR(100) NOT NULL,
    descricao VARCHAR(200),
    fornecedor VARCHAR(70),
    quantidade INT NOT NULL CHECK (quantidade >= 0),
    etiqueta VARCHAR(10) NOT NULL,
    lote VARCHAR(10) NOT NULL,
    data_entrada DATE NOT NULL,
    data_validade DATE,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    peso FLOAT NOT NULL CHECK (peso > 0),
    fk_funcionario_cargo_id INT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,          
    deleted_at DATETIME NULL DEFAULT NULL,        
    CONSTRAINT fk_produto_funcionario 
        FOREIGN KEY (fk_funcionario_cargo_id) REFERENCES funcionario(id_funcionario)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE entrada (
    id_entrada INT AUTO_INCREMENT PRIMARY KEY,
    id_cadastro INT NOT NULL,
    fk_produto_codigo_produto INT NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    peso_total FLOAT NOT NULL CHECK (peso_total > 0),
    data_entrada DATE NOT NULL,
    data_validade DATE,
    lote VARCHAR(10) NOT NULL,
    etiqueta VARCHAR(10) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    CONSTRAINT fk_entrada_funcionario 
        FOREIGN KEY (id_cadastro) REFERENCES funcionario(id_funcionario),
    CONSTRAINT fk_entrada_produto 
        FOREIGN KEY (fk_produto_codigo_produto) REFERENCES produto(codigo_produto)
) ENGINE=InnoDB;

CREATE TABLE estoque (
    id_estoque INT AUTO_INCREMENT PRIMARY KEY,
    id_entrada INT NOT NULL,
    CONSTRAINT fk_estoque_entrada 
        FOREIGN KEY (id_entrada) REFERENCES entrada(id_entrada)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE devolucao (
    id_devolucao INT AUTO_INCREMENT PRIMARY KEY,
    id_cadastro INT,
    fk_produto_codigo_produto INT NOT NULL,
    unidade INT NOT NULL CHECK (unidade > 0),
    motivo VARCHAR(500) NOT NULL,
    reutilizacao BOOLEAN NOT NULL,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    data_entrada DATE,
    etiqueta VARCHAR(10),
    CONSTRAINT fk_devolucao_funcionario 
        FOREIGN KEY (id_cadastro) REFERENCES funcionario(id_funcionario),
    CONSTRAINT fk_devolucao_produto 
        FOREIGN KEY (fk_produto_codigo_produto) REFERENCES produto(codigo_produto)
) ENGINE=InnoDB;

CREATE TABLE saida (
    id_saida INT AUTO_INCREMENT PRIMARY KEY,
    id_cadastro INT NOT NULL,
    fk_codigo_produto INT NOT NULL,
    destinatario VARCHAR(100) NOT NULL,
    data_saida DATE NOT NULL,
    codigo_cliente INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    unidades INT NOT NULL CHECK (unidades > 0),
    lote VARCHAR(10) NOT NULL,
    etiqueta VARCHAR(10) NOT NULL,
    codigo_rastreamento INT,
    CONSTRAINT fk_saida_funcionario 
        FOREIGN KEY (id_cadastro) REFERENCES funcionario(id_funcionario),
    CONSTRAINT fk_saida_produto 
        FOREIGN KEY (fk_codigo_produto) REFERENCES produto(codigo_produto)
) ENGINE=InnoDB;
