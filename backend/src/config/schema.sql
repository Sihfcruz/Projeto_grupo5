-- =====================================================================
-- NOMADE - Loja de tenis: estoque, vendas, pagamentos e trocas
-- Requer MySQL 8.0.16+ (CHECK constraints)
-- =====================================================================
CREATE DATABASE IF NOT EXISTS nomade
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nomade;

<<<<<<< Updated upstream

=======
-- ---------------------------------------------------------------------
-- CARGO / FUNCIONARIO
-- ---------------------------------------------------------------------
>>>>>>> Stashed changes
CREATE TABLE cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL UNIQUE,
    nivel_acesso INT NOT NULL CHECK (nivel_acesso >= 0)
) ENGINE=InnoDB;


CREATE TABLE funcionario (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    senha VARCHAR(255) NOT NULL,                  -- somente HASH (bcrypt/argon2)
    email VARCHAR(150) NOT NULL UNIQUE,
    id_cargo INT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    CONSTRAINT fk_funcionario_cargo
        FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

<<<<<<< Updated upstream
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
=======
-- ---------------------------------------------------------------------
-- CLIENTE / FORNECEDOR
-- ---------------------------------------------------------------------
CREATE TABLE cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo_pessoa ENUM('PF', 'PJ') NOT NULL DEFAULT 'PF',
    cpf_cnpj VARCHAR(18) NOT NULL UNIQUE,
    email VARCHAR(150),
    telefone VARCHAR(20),
    cep VARCHAR(9),
    logradouro VARCHAR(150),
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(80),
    cidade VARCHAR(80),
    uf CHAR(2),
    id_funcionario_cadastro INT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    CONSTRAINT fk_cliente_funcionario
        FOREIGN KEY (id_funcionario_cadastro) REFERENCES funcionario(id_funcionario)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE fornecedor (
    id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    email VARCHAR(150),
    telefone VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CATALOGO: marca, categoria, modelo e SKU (tamanho + cor)
-- ---------------------------------------------------------------------
CREATE TABLE marca (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    nome_marca VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome_categoria VARCHAR(60) NOT NULL UNIQUE     -- corrida, casual, skate, infantil...
) ENGINE=InnoDB;

-- MODELO: o "tenis" em si (ex.: Air Max 90)
CREATE TABLE modelo (
    id_modelo INT AUTO_INCREMENT PRIMARY KEY,
    nome_modelo VARCHAR(100) NOT NULL,
    descricao VARCHAR(200),
    id_marca INT NOT NULL,
    id_categoria INT NOT NULL,
    id_fornecedor INT NULL,
    genero ENUM('MASCULINO', 'FEMININO', 'UNISSEX', 'INFANTIL') NOT NULL DEFAULT 'UNISSEX',
    id_funcionario_cadastro INT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    CONSTRAINT uq_modelo_marca UNIQUE (id_marca, nome_modelo),
    CONSTRAINT fk_modelo_marca
        FOREIGN KEY (id_marca) REFERENCES marca(id_marca)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_modelo_categoria
        FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_modelo_fornecedor
        FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_modelo_funcionario
        FOREIGN KEY (id_funcionario_cadastro) REFERENCES funcionario(id_funcionario)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- SKU: a variacao vendavel (ex.: Air Max 90, preto, tamanho 42)
CREATE TABLE sku (
    id_sku INT AUTO_INCREMENT PRIMARY KEY,
    id_modelo INT NOT NULL,
    tamanho DECIMAL(3, 1) NOT NULL CHECK (tamanho BETWEEN 15 AND 50),
    cor VARCHAR(30) NOT NULL,
    codigo_barras VARCHAR(20) NOT NULL UNIQUE,
    preco_custo DECIMAL(10, 2) NOT NULL CHECK (preco_custo > 0),
    preco_venda DECIMAL(10, 2) NOT NULL CHECK (preco_venda > 0),
    estoque_minimo INT NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    CONSTRAINT uq_sku_variacao UNIQUE (id_modelo, tamanho, cor),
    CONSTRAINT fk_sku_modelo
        FOREIGN KEY (id_modelo) REFERENCES modelo(id_modelo)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ENTRADA: recebimento de mercadoria por SKU
-- ---------------------------------------------------------------------
CREATE TABLE entrada (
    id_entrada INT AUTO_INCREMENT PRIMARY KEY,
    id_funcionario INT NOT NULL,
    id_fornecedor INT NULL,
    id_sku INT NOT NULL,
>>>>>>> Stashed changes
    quantidade INT NOT NULL CHECK (quantidade > 0),
    valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total > 0),
    data_entrada DATE NOT NULL,
<<<<<<< Updated upstream
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
=======
    lote VARCHAR(20) NOT NULL,
    nota_fiscal VARCHAR(44) NULL,
    CONSTRAINT uq_entrada_sku_lote UNIQUE (id_sku, lote),
    CONSTRAINT fk_entrada_funcionario
        FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_funcionario)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_entrada_fornecedor
        FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_entrada_sku
        FOREIGN KEY (id_sku) REFERENCES sku(id_sku)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_entrada_data (data_entrada)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VENDA (cabecalho) e ITEM_VENDA (varios pares por venda)
-- ---------------------------------------------------------------------
CREATE TABLE venda (
    id_venda INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NULL,                           -- NULL = venda de balcao sem cadastro
    id_funcionario INT NOT NULL,
    data_venda DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    canal ENUM('LOJA', 'ONLINE') NOT NULL DEFAULT 'LOJA',
    status ENUM('ABERTA', 'PAGA', 'ENVIADA', 'ENTREGUE', 'CANCELADA') NOT NULL DEFAULT 'ABERTA',
    desconto DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
    valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
    codigo_rastreamento VARCHAR(50) NULL,
    observacao VARCHAR(255) NULL,
    CONSTRAINT fk_venda_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_venda_funcionario
        FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_funcionario)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_venda_data (data_venda),
    INDEX idx_venda_status (status),
    INDEX idx_venda_rastreamento (codigo_rastreamento)
) ENGINE=InnoDB;

CREATE TABLE item_venda (
    id_item_venda INT AUTO_INCREMENT PRIMARY KEY,
    id_venda INT NOT NULL,
    id_sku INT NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10, 2) NOT NULL CHECK (preco_unitario > 0),  -- preco praticado na hora
    desconto_item DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (desconto_item >= 0),
    CONSTRAINT uq_item_venda_sku UNIQUE (id_venda, id_sku),
    CONSTRAINT fk_item_venda_venda
        FOREIGN KEY (id_venda) REFERENCES venda(id_venda)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_item_venda_sku
        FOREIGN KEY (id_sku) REFERENCES sku(id_sku)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- PAGAMENTO (uma venda pode ter varios pagamentos)
-- ---------------------------------------------------------------------
CREATE TABLE pagamento (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_venda INT NOT NULL,
    forma ENUM('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'VALE_TROCA') NOT NULL,
    parcelas TINYINT NOT NULL DEFAULT 1 CHECK (parcelas BETWEEN 1 AND 24),
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    status ENUM('PENDENTE', 'APROVADO', 'RECUSADO', 'ESTORNADO') NOT NULL DEFAULT 'PENDENTE',
    data_pagamento DATETIME NULL,
    CONSTRAINT fk_pagamento_venda
        FOREIGN KEY (id_venda) REFERENCES venda(id_venda)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- DEVOLUCAO (devolucao ou troca de um item vendido)
-- Na troca, id_venda_troca aponta para a nova venda gerada.
-- ---------------------------------------------------------------------
CREATE TABLE devolucao (
    id_devolucao INT AUTO_INCREMENT PRIMARY KEY,
    id_funcionario INT NOT NULL,
    id_item_venda INT NOT NULL,
    tipo ENUM('DEVOLUCAO', 'TROCA') NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    motivo VARCHAR(500) NOT NULL,
    reutilizavel BOOLEAN NOT NULL,                 -- TRUE = par volta ao estoque
    valor_reembolso DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (valor_reembolso >= 0),
    id_venda_troca INT NULL,
    data_devolucao DATE NOT NULL,
    CONSTRAINT fk_devolucao_funcionario
        FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_funcionario)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_devolucao_item
        FOREIGN KEY (id_item_venda) REFERENCES item_venda(id_item_venda)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_devolucao_venda_troca
        FOREIGN KEY (id_venda_troca) REFERENCES venda(id_venda)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_devolucao_data (data_devolucao)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VIEW: saldo por SKU (entradas - vendas nao canceladas + devolucoes reutilizaveis)
-- ---------------------------------------------------------------------
CREATE VIEW vw_estoque_atual AS
SELECT
    s.id_sku,
    m.nome_modelo,
    mc.nome_marca,
    s.tamanho,
    s.cor,
    s.codigo_barras,
    COALESCE(e.total_entradas, 0)  AS total_entradas,
    COALESCE(v.total_vendido, 0)   AS total_vendido,
    COALESCE(d.total_devolvido, 0) AS total_devolvido,
    (COALESCE(e.total_entradas, 0)
     - COALESCE(v.total_vendido, 0)
     + COALESCE(d.total_devolvido, 0)) AS saldo_estoque,
    s.estoque_minimo,
    ((COALESCE(e.total_entradas, 0)
      - COALESCE(v.total_vendido, 0)
      + COALESCE(d.total_devolvido, 0)) <= s.estoque_minimo) AS abaixo_do_minimo
FROM sku s
JOIN modelo m  ON m.id_modelo = s.id_modelo
JOIN marca mc  ON mc.id_marca = m.id_marca
LEFT JOIN (
    SELECT id_sku, SUM(quantidade) AS total_entradas
    FROM entrada
    GROUP BY id_sku
) e ON e.id_sku = s.id_sku
LEFT JOIN (
    SELECT iv.id_sku, SUM(iv.quantidade) AS total_vendido
    FROM item_venda iv
    JOIN venda ve ON ve.id_venda = iv.id_venda
    WHERE ve.status <> 'CANCELADA'
    GROUP BY iv.id_sku
) v ON v.id_sku = s.id_sku
LEFT JOIN (
    SELECT iv.id_sku, SUM(dv.quantidade) AS total_devolvido
    FROM devolucao dv
    JOIN item_venda iv ON iv.id_item_venda = dv.id_item_venda
    WHERE dv.reutilizavel = TRUE
    GROUP BY iv.id_sku
) d ON d.id_sku = s.id_sku
WHERE s.ativo = TRUE AND s.deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- TRIGGERS de integridade
-- ---------------------------------------------------------------------
DELIMITER $$

-- Nao permite vender mais pares do que existem em estoque
CREATE TRIGGER trg_item_venda_valida_estoque BEFORE INSERT ON item_venda
FOR EACH ROW
BEGIN
    DECLARE v_saldo INT;

    SELECT saldo_estoque INTO v_saldo
    FROM vw_estoque_atual WHERE id_sku = NEW.id_sku;

    IF v_saldo IS NULL OR v_saldo < NEW.quantidade THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Estoque insuficiente para este SKU';
    END IF;
END$$

-- Nao permite devolver mais do que foi vendido no item
CREATE TRIGGER trg_devolucao_valida BEFORE INSERT ON devolucao
FOR EACH ROW
BEGIN
    DECLARE v_vendido INT;
    DECLARE v_ja_devolvido INT;

    SELECT quantidade INTO v_vendido
    FROM item_venda WHERE id_item_venda = NEW.id_item_venda;

    SELECT COALESCE(SUM(quantidade), 0) INTO v_ja_devolvido
    FROM devolucao WHERE id_item_venda = NEW.id_item_venda;

    IF v_vendido IS NULL OR v_ja_devolvido + NEW.quantidade > v_vendido THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Quantidade devolvida maior que a vendida';
    END IF;
END$$

DELIMITER ;
>>>>>>> Stashed changes
