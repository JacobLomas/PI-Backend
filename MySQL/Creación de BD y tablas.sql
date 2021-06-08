CREATE DATABASE comercioAmbulante1;
USE comercioAmbulante1;

CREATE TABLE roles (
    xrol_id INT PRIMARY KEY AUTO_INCREMENT,
    xnombre VARCHAR(20)
);
select * from roles;

CREATE TABLE clientes (
    xcliente_id INT PRIMARY KEY AUTO_INCREMENT,
    xnombre VARCHAR(30),
    xapellidos VARCHAR(30),
    xmail VARCHAR(50),
    xcontraseña CHAR(200),
    xtelf VARCHAR(20),
    xfecha_nacimiento DATE,
    ximagen varchar(50),
    xfecha_creación DATE,
    xultima_conexion DATE,
    xrol int,
    foreign key(xrol)
		references roles(xrol_id)
);


CREATE TABLE pedidos (
    xpedido_id INT PRIMARY KEY AUTO_INCREMENT,
    xcliente_id INT,
    xpedido_fecha DATE,
    xpendiente_entrega BOOLEAN,
    xtotal DECIMAL(15 , 2 ),
    FOREIGN KEY (xcliente_id)
        REFERENCES clientes (xcliente_id)
);

-- familia

CREATE TABLE familia (
    xfamilia_id INT AUTO_INCREMENT PRIMARY KEY,
    xdescripcion VARCHAR(20)
);
select * from familia;

-- subfamilia
CREATE TABLE subfamilia (
    xsubfamilia_id INT AUTO_INCREMENT PRIMARY KEY,
    xdescripcion VARCHAR(20),
    xfamilia_id int,
    foreign key (xfamilia_id) references familia(xfamilia_id)
    ON DELETE SET NULL,
);

select * from subfamilia;


CREATE TABLE articulos (
    xarticulo_id INT PRIMARY KEY AUTO_INCREMENT,
    xnombre VARCHAR(30),
    xdescripcion VARCHAR(60),
    xfamilia_id INT,
    xsubfamilia_id INT,
    ximagen VARCHAR(100),
    xprecio DECIMAL(15 , 2 ),
    xdescuento INT,
    xvisitas INT,
    xstock INT,
    xfecha_creacion DATETIME,
    FOREIGN KEY (xfamilia_id)
        REFERENCES familia (xfamilia_id)
        ON DELETE SET NULL,
    FOREIGN KEY (xsubfamilia_id)
        REFERENCES subfamilia (xsubfamilia_id)
        ON DELETE SET NULL
);

CREATE TABLE favoritos (
	xcliente_id INT,
    xarticulo_id INT,   
	FOREIGN KEY (xcliente_id) 
		REFERENCES clientes(xcliente_id)
        ON DELETE CASCADE,
	FOREIGN KEY (xarticulo_id) 
		REFERENCES articulos(xarticulo_id)
        ON DELETE CASCADE,
	PRIMARY KEY (xcliente_id, xarticulo_id)
);

CREATE TABLE puntuaciones (
    xpuntuacion_id INT AUTO_INCREMENT,
    xcliente_id INT,
    xarticulo_id INT,
    xpuntuacion FLOAT,
    xfecha_puntuacion DATE,
    PRIMARY KEY (xpuntuacion_id, xcliente_id, xarticulo_id),
    FOREIGN KEY (xcliente_id) REFERENCES clientes(xcliente_id),
    FOREIGN KEY (xarticulo_id) REFERENCES articulos(xarticulo_id),
    
)

CREATE TABLE pedidos_lineas (
    xpedido_lin_id INT AUTO_INCREMENT,
    xpedido_id INT,
    xarticulo_id INT,
    xcantidad INT,
    xpromocion VARCHAR(20),
    xporc_dtol DECIMAL(15 , 2 ),
    xsubtotal DECIMAL(15 , 2 ),
    PRIMARY KEY (xpedido_lin_id , xpedido_id , xarticulo_id),
    FOREIGN KEY (xpedido_id)
        REFERENCES pedidos (xpedido_id),
    FOREIGN KEY (xarticulo_id)
        REFERENCES articulos (xarticulo_id)
);
