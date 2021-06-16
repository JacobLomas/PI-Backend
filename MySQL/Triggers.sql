CREATE TRIGGER fotoFecha
before insert on clientes
for each row
	 SET NEW . xfecha_creación = CURDATE(), NEW.ximagen = '/images/perfiles/___default___.png'

    
CREATE TRIGGER fechaCreacionProducto
before insert on articulos
for each row
	set NEW.xfecha_creacion = CURDATE();


CREATE TRIGGER fechaPuntuacion
before insert on puntuaciones
for each row
	set NEW.xfecha_puntuacion = CURDATE();