CREATE TRIGGER fechaCreacionUsuario 
before insert on clientes
for each row
	set NEW.xfecha_creación = CURDATE();

    
CREATE TRIGGER fechaCreacionProducto
before insert on articulos
for each row
	set NEW.xfecha_creacion = CURDATE();


CREATE TRIGGER fechaPuntuacion
before insert on puntuaciones
for each row
	set NEW.xfecha_puntuacion = CURDATE();